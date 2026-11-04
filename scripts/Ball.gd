extends Node2D

class_name VolleyBall

var radius: float = 14.0
var velocity: Vector2 = Vector2.ZERO
var gravity: float = 900.0
var ground_y: float = 300.0
var net_x: float = 0.0
var court_half_width: float = 580.0
var in_play: bool = true
var match_ref: Node = null

func apply_impact(direction: Vector2, power: float, player_team: int) -> void:
    var force := direction.normalized() * Vector2(420.0, 350.0)
    velocity.x = force.x * power
    velocity.y = force.y * power
    velocity.y = min(velocity.y, -120.0)
    position += Vector2(0.0, -12.0)

func _step(delta: float, match: Node) -> void:
    if not in_play:
        return

    velocity.y += gravity * delta
    position += velocity * delta

    if position.x <= -court_half_width + radius:
        position.x = -court_half_width + radius
        velocity.x = abs(velocity.x) * 0.45
    elif position.x >= court_half_width - radius:
        position.x = court_half_width - radius
        velocity.x = -abs(velocity.x) * 0.45

    var net_half_width: float = 26.0
    if abs(position.x) <= net_half_width and position.y <= 200.0:
        position.x = net_half_width * sign(position.x) if sign(position.x) != 0 else net_half_width
        velocity.x *= -0.75
        velocity.y *= 0.85

    if position.y >= ground_y - radius:
        position.y = ground_y - radius
        var scoring_team: int = 0 if position.x > net_x else 1
        if is_instance_valid(match_ref):
            match_ref.register_point_for(scoring_team)
        in_play = false
