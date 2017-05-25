var config = {
    apiKey: "AIzaSyB2ICOwDl1uw_m_CJetUgO00sNbYe2ffyA",
    authDomain: "rps-multiplayer-16944.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-16944.firebaseio.com",
    projectId: "rps-multiplayer-16944",
    storageBucket: "rps-multiplayer-16944.appspot.com",
    messagingSenderId: "768095899523"
};
  
firebase.initializeApp(config);
database = firebase.database();

var currentPlayerTotal = 0;
var currentMatches = 0;
var myName = null;
var myPlayerID = null;
var myOppID = null;


var createPlayerEntry = function() {
	var $div1 = $("<div/>", {"class": "col-xs-4", "id": "addPlayer"});
	var $div1child1 = $("<div/>", {"class": "form-group"});
	var $div1child1child1 = $("<label/>", {"for": "addPlayerName"});
	var $div1child1child2 = $("<input>", {"type": "text", "class": "form-control", "id": "addPlayerName", "placeholder": "Enter Your Name"});

	var $div2 = $("<div/>", {"class": "col-xs-2", "id": "addPlayerButton"});
	var $div2child1 = $("<button/>", {"type": "submit", "class": "btn btn-primary form-control", "id": "addPlayerButton"});
	
	var $div3 = $("<div/>", {"class": "col-xs-6", "id": "currentPlayers"});
	var $div3child1 = $("<label/>");

	var first = $div1.append($div1child1.append($div1child1child1.text("Your Name: "), $div1child1child2));
	var second = $div2.append($div2child1.text("Join"));
	var third = $div3.append($div3child1.text("Available Opponents:"));

	$("#playerEntry").append(first, second, third);
}

var addPlayer = function() {
		event.preventDefault();
		// Need to add function to escape characters to prevent injection?
		myName = $("#addPlayerName").val().trim();

		if (myName !== "") {
			myPlayerID = currentPlayerTotal + 1;
			database.ref("players/" + myPlayerID).set({"active": "false", "losses": 0, "name": myName, "wins": 0});
			$("#addPlayerButton").empty();
			$("#addPlayer").html("<h5>Please Select An Opponent --> </h5>");
		} else {
			alert("Please Enter A Valid Player Name");
		}
}

var makePlayerButtons =  function(snapshot) {
	if (snapshot.val().name !== myName) {
		var player = $("<button/>", {"class": "playerButtons", "id": snapshot.key, "onClick": "oppSelect(this.id)"});
		$("#currentPlayers").append(player.text(snapshot.val().name));
		currentPlayerTotal += 1;
	}
}

var oppSelect = function(opp) {
	myOppID = parseInt(opp);
	var matchID = currentMatches + 1;
	database.ref("matches/" + matchID).set({"player1": myPlayerID, "player2": myOppID, "turn": 1});
	database.ref("players/" + myPlayerID).update({"active": "true"});
	database.ref("players/" + myOppID).update({"active": "true"});


	// Need to write function
	// setMatch();

	// Need to write function
	// setChat();
}


var matchStart = function() {

}

var updateMatchCount = function() {
	currentMatches += 1;
}



// Generate initial HTML for lower banner section
createPlayerEntry();

// Listen for "Join" button click or Enter key presses. Add player to DB "players" table.
$("#addPlayerButton").on("click", addPlayer);
$("#addPlayerName").on("keypress", function(event){
	if (event.which == 13) {
		addPlayer();
	}
});

// Listen to DB "players" table for added player. Make a player button for new player
database.ref("players").on("child_added", makePlayerButtons);
// Listen to DB "matches" table for added match.  Increment currentMatches counter for accurate matchIDs added later.
database.ref("matches").on("child_added", updateMatchCount);
