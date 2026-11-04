extends Node2D

class_name MatchController

const TEAM_A := 0
const TEAM_B := 1
const COURT_HALF_WIDTH := 580.0
const COURT_HALF_HEIGHT := 260.0
const GROUND_Y := 300.0
const NET_X := 0.0
const NET_HALF_WIDTH := 26.0

var score_a: int = 0
var score_b: int = 0
var game_finished: bool = false
var players: Array = []
var ball: VolleyBall

func setup_match() -> void:
    if is_instance_valid(ball):
        return

    ball = VolleyBall.new()
    ball.position = Vector2(0.0, 120.0)
    ball.ground_y = GROUND_Y
    ball.court_half_width = COURT_HALF_WIDTH
    ball.net_x = NET_X
    ball.match_ref = self
    add_child(ball)

    create_players()
    _reset_ball_for_side(TEAM_A, true)

func create_players() -> void:
    players.clear()
    for index in range(2):
        var left_player = preload("res://scripts/PlayerController.gd").new()
        left_player.configure(
            TEAM_A,
            index,
            "p1",
            GROUND_Y,
            ball,
            self
        )
        left_player.position = Vector2(-320.0 - index * 95.0, GROUND_Y)
        add_child(left_player)
        players.append(left_player)

        var right_player = preload("res://scripts/PlayerController.gd").new()
        right_player.configure(
            TEAM_B,
            index,
            "p2",
            GROUND_Y,
            ball,
            self
        )
        right_player.position = Vector2(320.0 + index * 95.0, GROUND_Y)
        add_child(right_player)
        players.append(right_player)

func register_point_for(team: int) -> void:
    if game_finished:
        return

    if team == TEAM_A:
        score_a += 1
    else:
        score_b += 1

    print("Score: %d x %d" % [score_a, score_b])

    if _has_win_condition():
        game_finished = true
        var winner_label: String = "Time A" if score_a > score_b else "Time B"
        print("Vitória: %s" % winner_label)
        return

    _reset_ball_for_side(1 - team, false)

func _has_win_condition() -> bool:
    var lead: int = abs(score_a - score_b)
    if score_a >= 5 and lead >= 2:
        return true
    if score_b >= 5 and lead >= 2:
        return true
    return false

func _reset_ball_for_side(team: int, initial_reset: bool = false) -> void:
    if not is_instance_valid(ball):
        return

    ball.in_play = true
    ball.position = Vector2(0.0, 120.0)

    if team == TEAM_A:
        ball.velocity = Vector2(-120.0, -280.0) if initial_reset else Vector2(120.0, -260.0)
    else:
        ball.velocity = Vector2(120.0, -260.0) if initial_reset else Vector2(-120.0, -260.0)

func _process(delta: float) -> void:
    if game_finished:
        return

    for player in players:
        player.update_player(delta)

    if is_instance_valid(ball):
        ball._step(delta, self)

func get_court_bounds() -> Dictionary:
    return {
        "left": -COURT_HALF_WIDTH,
        "right": COURT_HALF_WIDTH,
        "top": -COURT_HALF_HEIGHT,
        "bottom": GROUND_Y
    }

func is_ball_in_valid_area() -> bool:
    return abs(ball.position.x) <= COURT_HALF_WIDTH and ball.position.y <= GROUND_Y
