extends RefCounted

class_name SupabaseClient

const DEFAULT_TIMEOUT_SECONDS: float = 15.0

var base_url: String = ""
var anon_key: String = ""
var enable_sync: bool = false
var offline_mode: bool = true
var default_player_id: String = "local-player"
var auth_token: String = ""
var request_timeout: float = DEFAULT_TIMEOUT_SECONDS
var queue: OfflineSyncQueue


func _init() -> void:
    queue = OfflineSyncQueue.new()


func configure(
    url: String,
    key: String,
    sync_enabled: bool = false,
    offline_enabled: bool = true,
    player_id: String = "",
    auth_token_value: String = ""
) -> void:
    base_url = url.strip_edges().rstrip("/")
    anon_key = key.strip_edges()
    enable_sync = sync_enabled
    offline_mode = offline_enabled

    if player_id.strip_edges() != "":
        default_player_id = player_id.strip_edges()
    if auth_token_value.strip_edges() != "":
        auth_token = auth_token_value.strip_edges()


func is_available() -> bool:
    return enable_sync and not offline_mode and base_url != "" and anon_key != ""


func build_headers(include_auth: bool = true) -> PackedStringArray:
    var headers: PackedStringArray = [
        "Content-Type: application/json",
        "Accept: application/json",
        "apikey: %s" % anon_key,
    ]
    if include_auth and auth_token != "":
        headers.append("Authorization: Bearer %s" % auth_token)
    return headers


func _build_request_id(payload: Dictionary) -> String:
    var seed := "%s:%s:%s:%s" % [
        String(payload.get("match_id", "")),
        String(payload.get("player_id", "")),
        String(payload.get("played_at", "")),
        str(Time.get_unix_time_from_system_usec()),
    ]
    return seed.sha256_text()


func _normalize_match_payload(payload: Dictionary) -> Dictionary:
    var normalized := payload.duplicate(true)
    if String(normalized.get("player_id", "")) == "":
        normalized["player_id"] = default_player_id
    if String(normalized.get("request_id", "")) == "":
        normalized["request_id"] = _build_request_id(normalized)
    if String(normalized.get("match_id", "")) == "":
        normalized["match_id"] = normalized.get("request_id", "")
    if String(normalized.get("played_at", "")) == "":
        normalized["played_at"] = Time.get_datetime_string_from_system()
    return normalized


func _request_json(endpoint: String, method: int = HTTPClient.METHOD_GET, payload: Dictionary = {}) -> Dictionary:
    if base_url == "" or anon_key == "":
        return {"status": "error", "error": "missing_base_url_or_key"}

    var http := HTTPRequest.new()
    add_child(http)
    http.timeout = int(request_timeout * 1000.0)

    var request_body := ""
    if payload.size() > 0:
        request_body = JSON.stringify(payload)

    var request_error := http.request(
        "%s%s" % [base_url, endpoint],
        build_headers(method != HTTPClient.METHOD_GET),
        method,
        request_body
    )

    if request_error != OK:
        return {"status": "error", "error": "request_failed", "detail": str(request_error)}

    var result: Array = await http.request_completed
    var response_code := int(result[1])
    var response_body := result[3]
    var raw_text := response_body.get_string_from_utf8()
    var json_data = JSON.parse_string(raw_text)

    if response_code < 200 or response_code >= 300:
        return {"status": "error", "error": "http_%d" % response_code, "detail": raw_text}

    if raw_text.strip_edges() == "":
        return {"status": "ok", "data": []}

    if typeof(json_data) == TYPE_ARRAY or typeof(json_data) == TYPE_DICTIONARY:
        return {"status": "ok", "data": json_data}

    return {"status": "ok", "data": []}


func send_match_result(payload: Dictionary) -> Dictionary:
    var normalized := _normalize_match_payload(payload)
    var request_id := String(normalized.get("request_id", ""))

    if not is_available():
        var queued := queue.enqueue(normalized)
        return {
            "status": queued.get("status", "queued"),
            "saved": false,
            "queued": true,
            "offline": true,
            "request_id": request_id,
            "duplicate": queued.get("status", "") == "duplicate",
        }

    var response := await _request_json(
        "/rest/v1/match_results",
        HTTPClient.METHOD_POST,
        normalized
    )

    if response.get("status") == "ok":
        queue.remove_completed(request_id)
        return {"status": "sent", "saved": true, "request_id": request_id}

    queue.enqueue(normalized)
    return {
        "status": "queued",
        "saved": false,
        "queued": true,
        "offline": true,
        "request_id": request_id,
        "error": response.get("error", "unknown_error"),
    }


func fetch_rankings() -> Dictionary:
    if not is_available():
        return {"entries": [], "status": "offline"}

    var response := await _request_json(
        "/rest/v1/player_rankings?select=player_id,display_name,wins,losses,win_rate,points_for,points_against"
    )

    if response.get("status") != "ok":
        return {"entries": [], "status": "offline", "error": response.get("error", "request_failed")}

    var data = response.get("data", [])
    if typeof(data) != TYPE_ARRAY:
        return {"entries": [], "status": "error", "error": "invalid_rankings_payload"}

    return {"entries": data, "status": "ok"}


func fetch_match_history() -> Dictionary:
    if not is_available():
        return {"matches": [], "status": "offline"}

    var response := await _request_json(
        "/rest/v1/match_results?select=*&order=played_at.desc"
    )

    if response.get("status") != "ok":
        return {"matches": [], "status": "offline", "error": response.get("error", "request_failed")}

    var data = response.get("data", [])
    if typeof(data) != TYPE_ARRAY:
        return {"matches": [], "status": "error", "error": "invalid_history_payload"}

    return {"matches": data, "status": "ok"}


func fetch_player_stats(player_id: String) -> Dictionary:
    var safe_id := String(player_id).strip_edges()
    if safe_id == "":
        safe_id = default_player_id

    if not is_available():
        return {"player_id": safe_id, "stats": {}, "status": "offline"}

    var endpoint := "/rest/v1/player_stats?player_id=eq.%s&select=*" % safe_id
    var response := await _request_json(endpoint)

    if response.get("status") != "ok":
        return {"player_id": safe_id, "stats": {}, "status": "offline", "error": response.get("error", "request_failed")}

    var data = response.get("data", [])
    if typeof(data) == TYPE_ARRAY and data.size() > 0:
        return {"player_id": safe_id, "stats": data[0], "status": "ok"}
    if typeof(data) == TYPE_DICTIONARY:
        return {"player_id": safe_id, "stats": data, "status": "ok"}

    return {"player_id": safe_id, "stats": {}, "status": "ok"}
