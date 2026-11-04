extends Node2D

class_name PlayerController

const MAX_STAMINA := 100.0
const JUMP_FORCE := 610.0
const GRAVITY := 1300.0
const DEFAULT_SPEED := 240.0
const MAX_ATTACK_CHARGE := 1.35

var team: int = 0
var player_index: int = 0
var control_prefix: String = "p1"
var base_speed: float = DEFAULT_SPEED
var ground_y: float = 300.0
var stamina: float = MAX_STAMINA
var charge: float = 0.0
var vertical_velocity: float = 0.0
var grounded: bool = true
var facing: int = 1
var ball_ref: Node2D = null
var match_ref: Node = null
var controls: Dictionary = {}

func configure(team_id: int, index: int, prefix: String, floor_y: float, ball: Node2D, match: Node) -> void:
    team = team_id
    player_index = index
    control_prefix = prefix
    ground_y = floor_y
    ball_ref = ball
    match_ref = match

    controls = {
        "left": "%s_left" % prefix,
        "right": "%s_right" % prefix,
        "jump": "%s_jump" % prefix,
        "attack": "%s_attack" % prefix,
        "defense": "%s_defense" % prefix
    }

    if team == 0:
        facing = -1
    else:
        facing = 1

func _ready() -> void:
    position.y = ground_y

func update_player(delta: float) -> void:
    var horizontal_input := 0.0
    if Input.is_action_pressed(controls["left"]):
        horizontal_input -= 1.0
    if Input.is_action_pressed(controls["right"]):
        horizontal_input += 1.0

    if horizontal_input != 0.0:
        facing = 1 if horizontal_input > 0.0 else -1

    var speed_multiplier := 1.0
    if stamina <= 0.0:
        speed_multiplier = 0.55

    position.x += horizontal_input * base_speed * speed_multiplier * delta
    position.x = clamp(position.x, -580.0, 580.0)

    if grounded and Input.is_action_just_pressed(controls["jump"]):
        vertical_velocity = -JUMP_FORCE
        grounded = false
        stamina = max(0.0, stamina - 8.0)

    vertical_velocity += GRAVITY * delta
    position.y += vertical_velocity * delta

    if position.y >= ground_y:
        position.y = ground_y
        vertical_velocity = 0.0
        grounded = true

    var recovery_rate := 12.0 if grounded else 6.0
    stamina = clamp(stamina + recovery_rate * delta, 0.0, MAX_STAMINA)

    if Input.is_action_pressed(controls["attack"]):
        charge = min(MAX_ATTACK_CHARGE, charge + delta * 1.5)
        stamina = max(0.0, stamina - 12.0 * delta)
    elif charge > 0.05:
        execute_attack()

    if Input.is_action_pressed(controls["defense"]):
        execute_defense()

func execute_attack() -> void:
    if not is_instance_valid(ball_ref):
        charge = 0.0
        return

    var distance := position.distance_to(ball_ref.position)
    var reach := 78.0 + ball_ref.radius
    if distance > reach:
        charge = 0.0
        return

    var attack_power := clamp(charge, 0.2, 1.45)
    if charge > MAX_ATTACK_CHARGE:
        attack_power *= 0.7

    var direction: Vector2 = Vector2(1.0 if team == 0 else -1.0, -0.65).normalized()
    ball_ref.apply_impact(direction, attack_power, team)
    charge = 0.0

func execute_defense() -> void:
    if not is_instance_valid(ball_ref):
        return

    var distance := position.distance_to(ball_ref.position)
    if distance > 90.0:
        return

    var incoming_direction := sign(ball_ref.velocity.x)
    if incoming_direction == 0:
        incoming_direction = 1 if team == 0 else -1

    if team == 0 and ball_ref.position.x > position.x:
        var defense_strength := 0.7 if stamina > 0.0 else 0.3
        ball_ref.velocity.x = -abs(ball_ref.velocity.x) * defense_strength
        ball_ref.velocity.y = min(ball_ref.velocity.y, -120.0)
    elif team == 1 and ball_ref.position.x < position.x:
        var defense_strength := 0.7 if stamina > 0.0 else 0.3
        ball_ref.velocity.x = abs(ball_ref.velocity.x) * defense_strength
        ball_ref.velocity.y = min(ball_ref.velocity.y, -120.0)

    if stamina <= 0.0:
        ball_ref.velocity.x *= 0.8
