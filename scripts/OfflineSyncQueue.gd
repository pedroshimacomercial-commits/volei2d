extends RefCounted

class_name OfflineSyncQueue

var storage_path: String = "user://supabase_sync_queue.json"
var _entries: Array = []


func _init() -> void:
    _load()


func _load() -> void:
    _entries.clear()
    if not FileAccess.file_exists(storage_path):
        return

    var file := FileAccess.open(storage_path, FileAccess.READ)
    if file == null:
        return

    var raw_text := file.get_as_text()
    file.close()
    if raw_text.strip_edges() == "":
        return

    var parsed = JSON.parse_string(raw_text)
    if typeof(parsed) == TYPE_ARRAY:
        _entries = parsed
    else:
        _entries = []


func save() -> void:
    var file := FileAccess.open(storage_path, FileAccess.WRITE)
    if file == null:
        return
    file.store_string(JSON.stringify(_entries))
    file.close()


func enqueue(entry: Dictionary) -> Dictionary:
    if entry.is_empty():
        return {"status": "invalid"}

    var dedupe_key := _dedupe_key_for(entry)
    for item in _entries:
        if typeof(item) != TYPE_DICTIONARY:
            continue
        var candidate: Dictionary = item
        var candidate_id := String(candidate.get("request_id", ""))
        var candidate_match_id := String(candidate.get("match_id", ""))
        var entry_match_id := String(entry.get("match_id", ""))
        if candidate_id == dedupe_key or candidate_match_id == entry_match_id:
            return {"status": "duplicate", "request_id": dedupe_key}

    var item := entry.duplicate(true)
    if String(item.get("request_id", "")) == "":
        item["request_id"] = dedupe_key
    if String(item.get("created_at", "")) == "":
        item["created_at"] = Time.get_datetime_string_from_system()

    _entries.append(item)
    save()
    return {"status": "queued", "request_id": item.get("request_id", "")}


func _dedupe_key_for(entry: Dictionary) -> String:
    var request_id := String(entry.get("request_id", ""))
    if request_id != "":
        return request_id

    var match_id := String(entry.get("match_id", ""))
    if match_id != "":
        return "match:%s" % match_id

    var player_id := String(entry.get("player_id", ""))
    var played_at := String(entry.get("played_at", ""))
    var seed := "%s:%s:%s" % [player_id, played_at, str(Time.get_unix_time_from_system_usec())]
    return seed.sha256_text()


func remove_completed(request_id: String) -> bool:
    var normalized_id := String(request_id)
    var filtered: Array = []
    var removed := false

    for item in _entries:
        if typeof(item) != TYPE_DICTIONARY:
            continue
        var candidate: Dictionary = item
        if String(candidate.get("request_id", "")) == normalized_id:
            removed = true
            continue
        filtered.append(candidate)

    if removed:
        _entries = filtered
        save()

    return removed


func get_pending() -> Array:
    return _entries.duplicate()


func clear() -> void:
    _entries.clear()
    save()
