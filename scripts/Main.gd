extends Node2D

@export var game_title: String = "Beach Volleyball 2D"

var match_controller: MatchController

func _ready() -> void:
    print("%s initialized" % game_title)
    match_controller = MatchController.new()
    add_child(match_controller)
    match_controller.setup_match()
