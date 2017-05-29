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

var currentPlayerIndex = 0;
var currentMatchIndex = 0;
var currentChatIndex = 0;
var currentMessageIndex = 0;

var myName = null;
var myPlayerID = null;
var myWins = null;
var myLosses = null;

var oppName = null;
var oppPlayerID = null;
var oppWins = null;
var oppLosses = null;

var matchID = null;
var chatID = null;

// Object with functions to generate HTML for the lower banner section.
var createPlayerEntry = {
	
	addPlayerDiv: function() {
		var $div1 = $("<div/>", {"class": "col-xs-4", "id": "addPlayer"});
		var $div1child1 = $("<div/>", {"class": "form-group"});
		var $div1child1child1 = $("<label/>", {"for": "addPlayerName"});
		var $div1child1child2 = $("<input>", {"type": "text", "class": "form-control", "id": "addPlayerName", "placeholder": "Enter Your Name"});

		var $allDiv1 = $div1.append($div1child1.append($div1child1child1.text("Your Name: "), $div1child1child2));
		$("#playerEntry").append($allDiv1);
	},

	addPlayerButtonDiv: function() {
		var $div2 = $("<div/>", {"class": "col-xs-2", "id": "addPlayerButton"});
		var $div2child1 = $("<button/>", {"type": "submit", "class": "btn btn-primary form-control", "id": "addPlayerButton"});
		
		var $allDiv2 = $div2.append($div2child1.text("Join"));
		$("#playerEntry").append($allDiv2);
	},

	currentPlayersDiv: function() {
		var $div3 = $("<div/>", {"class": "col-xs-6", "id": "currentPlayers"});
		var $div3child1 = $("<label/>");

		var $allDiv3 = $div3.append($div3child1.text("Available Opponents:"));
		$("#playerEntry").append($allDiv3);
	}
};

// Broken Function!!  Need to write
var getInitialDBValues = function() {
	// database.ref("players").limitLast(1).orderByChild("key").once("child_added").then(function(snapshot){
	// 	console.log(snapshot.key);
	// });
}

// On HTML "Join" button click, add player to the players DB table.
var addPlayer = function() {
		event.preventDefault();
		
		// <---- *** Need to add function to escape characters to prevent injection?
		myName = $("#addPlayerName").val().trim();

		// Check for blank name in input box.  If not blank, creat player object with properties.
		if (myName !== "") {
			myPlayerID = currentPlayerIndex + 1;
			database.ref("players/" + myPlayerID).set({"active": "false", "losses": 0, "name": myName, "wins": 0});
			$("#addPlayer").empty();
			$("#addPlayerButton").empty();
			$("#gameReadout").html("<h4>Please select an opponent to play against!</h4>");
		} else {
			alert("Please Enter A Valid Player Name");
		}

		// Listen for current window disconnect.  Remove this player from DB "players" table upon disconnection.
		database.ref("players/" + myPlayerID).onDisconnect().remove();

		// Listen for value change on DB (players child) "myPlayerID" object to sync wins/losses and write to HTML.
		database.ref("players/" + myPlayerID).on("value", function(snapshot){
			myName = snapshot.val().name;
			myWins = snapshot.val().wins;
			myLosses = snapshot.val().losses;
			updateWinsLosses(myPlayerID);
		});

		// Set player as active
		database.ref("players/" + myPlayerID).update({"active": "true"});
}

var makePlayerButtons =  function(snapshot) {
	// Generate player buttons for all players not currently in match.  Do not display current window's player button.
	if (snapshot.val().name !== myName && snapshot.val().active === "false") {
		var player = $("<button/>", {"class": "btn btn-success playerButtons", "id": snapshot.key, "onClick": "oppSelect(this.id)"});
		$("#currentPlayers").append(player.text(snapshot.val().name));
	}
}

var oppSelect = function(opp) {
	// Set oppPlayerID and oppName based on button HTML values
	oppPlayerID = parseInt(opp);
	oppName = $("#" + oppPlayerID).text(); 

	// Listen for value change on DB (players child) "oppPlayerID" object to sync wins/losses and write to HTML.
	database.ref("players/" + oppPlayerID).once("value").then(function(snapshot){
		oppName = snapshot.val().name;
		var oppWins = snapshot.val().wins;
		var oppLosses = snapshot.val().losses;
		updateWinsLosses(oppPlayerID);
	});

	// Set player as active
	database.ref("players/" + oppPlayerID).update({"active": "true"});
	
	clearPlayerEntry();
	setMatch();

	$("#gameReadout").html("You will playing against " + oppName);
}

var playerChosen = function(snapshot) {
	console.log("playerChosen ready", snapshot.val().player1, snapshot.val().player2);
	if (snapshot.val().player2 === myPlayerID) {
		oppPlayerID = snapshot.val().player1;
		
		// <--- Not Working!
		database.ref("players/" + oppPlayerID).once("value").then(function(snapshot){
			oppName = snapshot.name;
		});
		

		clearPlayerEntry();
		$("#gameReadout").html(oppName + " has chosen to play with you");
	}
}

var clearPlayerEntry = function() {
	// Clear lower banner
	$("#addPlayer").empty();
	$("#addPlayerButton").empty();
	$("#currentPlayers").empty();
}

var setMatch = function() {
	matchID = currentMatchIndex + 1;
	
	// Set new match in DB matches table.
	database.ref("matches/" + matchID).set({"player1": myPlayerID, "player2": oppPlayerID, "turn": "1"});
	
	// Initialize chat
	setChat();
}

// Need to write function
var setChat = function() {
	console.log("chat function called");
}

// Need to write function
var matchStart = function() {

}





var updatePlayerIndex = function(snapshot) {
	currentPlayerIndex += 1;
}

var updateMatchIndex = function(snapshot) {
	currentMatchIndex += 1;
}

var updateChatIndex = function(snapshot) {
	currentChatIndex += 1;
}

var updateMessageIndex = function(snapshot) {
	currentMessageIndex += 1;
}

// Updates wins and losses for player passed as argument.
var updateWinsLosses = function(playerID) {
	var p = playerID;
	var name = "";
	var wins = null;
	var losses = null;

	if (playerID === myPlayerID) {
		$("#player1Name").text("Player 1:   " + myName);
		$("#player1Wins").text("Wins:  " + myWins);
		$("#player1Losses").text("Losses:  " + myLosses); 
	} else if (playerID === oppPlayerID) {
		$("#player2Name").text("Player 2:   " + oppName);
		$("#player2Wins").text("Wins:  " + oppWins);
		$("#player2Losses").text("Losses:  " + oppLosses);
	}
}


// On document ready, run initial functions and set listeners.
$(document).ready(function(){
	// Retrieve initial database values for current table indicies.
	getInitialDBValues();
	// Generate initial HTML for lower banner section.
	createPlayerEntry.addPlayerDiv();
	createPlayerEntry.addPlayerButtonDiv();
	createPlayerEntry.currentPlayersDiv();

	// Listen for "Join" button click or Enter key presses. Add player to DB "players" table.
	$("#addPlayerButton").on("click", addPlayer);
	$("#addPlayerName").on("keypress", function(event){
		if (event.which == 13) {
			addPlayer();
		}
	});
	// Listen to DB "players" table for player value change. Make a player button for all inactive players, remove active players.
	database.ref("players").on("child_added", makePlayerButtons);
	// Listen to DB "players" table for added player.  Increment currentPlayerIndex counter for accurate playersIDs added later.
	database.ref("players").on("child_added", updatePlayerIndex);
	// Listen to DB "players" table for player being removed. Run function to clear match, chat, and reset opponent's status.
	database.ref("players").on("child_removed", function(oldChildSnapshot){

		if (oppPlayerID == oldChildSnapshot.key) {
			
			// <--- Not Working!
			// database.ref("matches/1").once("value").then(function(snapshot){
			// 	console.log(snapshot.player1);
			// });

			
			database.ref("players/" + myPlayerID).remove();

			oppPlayerID = null;
			oppName = null;

			// <--- Not Working!
			// database.ref("players").once("value").then(function(snapshot){
			// 	// console.log(snapshot.child(myPlayerID));
			// });

			createPlayerEntry.currentPlayersDiv();
			$("#gameReadout").html("<h4>Please select an opponent to play against!</h4>");
			database.ref("players/" + myPlayerID).set({"active": "false", "losses": 0, "name": myName, "wins": 0});
		}
	});

	// Listen to DB "players" table for value changes on myPlayerID and oppPlayerID.  Run updateWinsLosses function to sync correct stats.
		// Need to write

	// Listen to DB "matches" table for added match.  Run functions.
	database.ref("matches").on("child_added", function(snapshot){
		// Increment the currentMatchIndex to keep sync
		updateMatchIndex(snapshot);
		console.log("updateMatchIndex called");
		// Check to see if current window's player is chosen as an opponent.  If so, set HTML and start match.
		playerChosen(snapshot);
		console.log("playerChosen called");
	});
	

	// Listen to DB "chats" table for added chat.  Increment currentChatIndex counter for accurate chatIDs added later.
	database.ref("chats").on("child_added", updateChatIndex);
	// Listen to DB (chats child) "messages" table for added message.  Increment currentMessageIndex counter for accurate messageIDs added later.
	database.ref("chats/messages").on("child_added", updateMessageIndex);

});

