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

var signedIn = false;
var isChosen = false;
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
var chatListener = false;
var turn = 1;

// Grabs current array indexes for players table and matches table to set current index variables locally
var getInitialDBValues = function() {
	database.ref("players").once("value", function(snapshot){
		var playerObject = snapshot.val();
		
		if (playerObject != null) {
			var playerIDArray = Object.keys(playerObject);
			var ind = playerIDArray.length - 1;
			currentPlayerIndex = parseInt(playerIDArray[ind]);
		} else {
			currentPlayerIndex = 0;
		}

		// TESTING
		console.log(snapshot.val(), currentPlayerIndex);
	});

	database.ref("matches").once("value", function(snapshot){
		var matchArray = snapshot.val();
		
		if (matchArray != null) {
			currentMatchIndex = snapshot.val().length - 1;
		} else {
			currentMatchIndex = 0;
		}

		// TESTING
		console.log(snapshot.val(), currentMatchIndex);
		
		currentChatIndex = currentMatchIndex;
		currentMessageIndex = 0;
	});
}

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

// On HTML "Join" button click, add player to the players DB table.
var addPlayer = function() {
		event.preventDefault();
		
		// <---- *** Need to add function to escape characters to prevent injection?
		myName = $("#addPlayerName").val().trim();
		myPlayerID = currentPlayerIndex + 1;

		// Check for blank name in input box.  If not blank, creat player object with properties.
		if (myName !== "") {
			database.ref("players/" + myPlayerID).set({"active": "false", "losses": 0, "name": myName, "wins": 0});
			signedIn = true;
			$("#addPlayer").html("<h4>Welcome, " + myName + "!</h4>");
			$("#addPlayerButton").empty();
			$("#gameReadout").html("<h5>Please select an opponent to play against!</h5>");
		} else {
			alert("Please Enter A Valid Player Name");
		}

		// Listen for current window disconnect.  Remove this player from DB "players" table upon disconnection.
		database.ref("players/" + myPlayerID).onDisconnect().remove();

		// Listen for value change on DB (players child) "myPlayerID" object to sync wins/losses and write to HTML. If player is active and there is no matchID set, set new match
		database.ref("players/" + myPlayerID).on("value", function(snapshot){
			if (snapshot.val().active === "true" && matchID === null) {
				isChosen = true;
				clearPlayerEntry();
			}

			myName = snapshot.val().name;
			myWins = snapshot.val().wins;
			myLosses = snapshot.val().losses;
			updateWinsLosses(myPlayerID);
		});
}

// Generate player buttons for each players not currently in match (upon DB add).  Do not display current window's player button.
var makePlayerButtons =  function(snapshot) {
	if (snapshot.val().name !== myName && snapshot.val().active === "false") {
		var player = $("<button/>", {"class": "btn btn-success playerButtons", "id": snapshot.key, "onClick": "oppSelect(this.id)"});
		$("#currentPlayers").append(player.text(snapshot.val().name));
	}
}

// Generate all available player buttons for players not currently in match (full DB).  Do not display current window's player button.
var makeAllPlayerButtons = function(snapshot) {

	if (snapshot.val() != null) {
		// Iterate through available players and create buttons.
		for (i = 0; i < snapshot.val().length; i++) {
			if (snapshot.child(i).val() !== null) {	
				if (snapshot.child(i).val().name !== myName && snapshot.child(i).val().active === "false") {
					var player = $("<button/>", {"class": "btn btn-success playerButtons", "id": snapshot.child(i).key, "onClick": "oppSelect(this.id)"});
					$("#currentPlayers").append(player.text(snapshot.child(i).val().name));
				}
			}
		}
	}
}

// Set opponent upon click of available player button
var oppSelect = function(opp) {
	if (signedIn === true) {
		// Set oppPlayerID and oppName based on button HTML values
		oppPlayerID = parseInt(opp);
		oppName = $("#" + oppPlayerID).text(); 

		// Listen for value change on DB (players child) "oppPlayerID" object to sync wins/losses and write to HTML.
		database.ref("players/" + oppPlayerID).on("value", function(snapshot){
			if (snapshot.val() !== null) {
				oppName = snapshot.val().name;
				oppWins = snapshot.val().wins;
				oppLosses = snapshot.val().losses;
				updateWinsLosses(oppPlayerID);
			}	
		});

		// Set player as active
		database.ref("players/" + oppPlayerID).update({"active": "true"});
		database.ref("active/" + oppPlayerID).set({"active": "true"});
		
		// Clear lower banner player entry section
		clearPlayerEntry();
		setMatch();
	
	} else {
	
		alert("You cannot choose an opponent until you join the game.");
	
	}
}

var clearPlayerEntry = function() {
	// Clear lower banner
	$("#addPlayer").empty();
	$("#addPlayerButton").empty();
	$("#currentPlayers").remove();
}

// Sets up the match
var setMatch = function() {

	matchID = currentMatchIndex + 1;
	
	// Set new match in DB matches table.
	database.ref("matches/" + matchID).set({"player1": myPlayerID, "player2": oppPlayerID, "turn": "1"});
	$("#gameReadout").html("<h4>You will be playing against " + oppName + ".</h4>");

	// Set player as active
	database.ref("players/" + myPlayerID).update({"active": "true"});
	database.ref("active/" + myPlayerID).set({"active": "true"});

	// Initialize chat
	setChat();
}

// If active window player was chosen, set opponent values to local variables.  Start the game.
var startMatch = function() {
	if (isChosen === true) {
		
		// Listen for value change on DB (players child) "oppPlayerID" object to sync wins/losses and write to HTML.
		database.ref("players/" + oppPlayerID).on("value", function(snapshot){
			if (snapshot.val() !== null) {
				oppName = snapshot.val().name;
				oppWins = snapshot.val().wins;
				oppLosses = snapshot.val().losses;
				updateWinsLosses(oppPlayerID);
			}
		});

		// Set display readout
		$("#gameReadout").html("<h4>" + oppName + " has chosen to play against you!</h4>");
		
		// Initialize chat
		setChat();
	}
}

// Sets up chat.
var setChat = function() {
	chatID = matchID;
}

// Pushes chat messages to "chats" DB table.
var sendChat = function() {
	event.preventDefault();

	if (signedIn == true && chatID != null) {
		var messageIndex = currentMessageIndex + 1;
		var p = myName;
		// Take value from chat text entry box.
		var m = $("#sendChatMessage").val();
		$("#sendChatMessage").val("");
		

		// <--- Need to set time stamp with moment.js.
		var t = "test time";


		database.ref("chats/" + chatID + "/" + messageIndex).update({"name": p, "message": m, "time": t});
	} else {
		alert("You cannot chat until you join the game and begin a match.");
	}
}





// Updates game indexes based on event listeners
	var updatePlayerIndex = function() {
		currentPlayerIndex += 1;
	}

	var updateMatchIndex = function() {
		currentMatchIndex += 1;
	}

	var updateChatIndex = function() {
		currentChatIndex += 1;
	}

	var updateMessageIndex = function() {
		currentMessageIndex += 1;
	}


// Updates game play elements.
	// Make sure chat section is scrolled to the bottom position to view newest message when it enters the DB.
	var updateChatScroll = function() {
		$("#chatHistory").each(function() {
		   var scrollHeight = Math.max(this.scrollHeight, this.clientHeight);
		   this.scrollTop = scrollHeight - this.clientHeight;
		});
	}

	// Updates wins and losses for playerID passed as argument.
	var updateWinsLosses = function(playerID) {

		if (playerID === myPlayerID) {
			$("#player1Name").html("You:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + myName);
			$("#player1Wins").text("Wins:  " + myWins);
			$("#player1Losses").text("Losses:  " + myLosses); 
		} else if (playerID === oppPlayerID) {
			$("#player2Name").html("Opponent:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + oppName);
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
		if (event.which == 13 && signedIn === false) {
			addPlayer();
		}
	});

	// Listen to DB "players" table for player added.  Run functions.
	database.ref("players").on("child_added", function(snapshot){
	
		// Make a player button for all inactive players, remove active players.
		makePlayerButtons(snapshot);
		// Increment currentPlayerIndex counter for accurate playersIDs added later.
		updatePlayerIndex();

	});

	// Listen to DB "players" table for player being removed. Run function to clear match, chat, and reset opponent's status.
	database.ref("players").on("child_removed", function(oldChildSnapshot){

		var removedChild = oldChildSnapshot.val();
		var removedID = parseInt(oldChildSnapshot.key);
		database.ref("active/" + removedID).remove();
		
		// Removes player button
		$("#" + removedID).remove();

		// Checks if the player that disconnected was the opponent.
		if (removedID === oppPlayerID) {
			
			// Reset displays and opponent variables.
			$("#gameReadout").empty();
			$("#gameReadout").html("<h4>" + oppName + " has left the match!</h4>");
			$("#chatHistory").append("<span class=\"chatSpan\"><h6>" + oppName + " has disconnected.</h6></span>");
			$("#player2Name").text("Opponent:   ");
			$("#player2Wins").text("Wins:  ");
			$("#player2Losses").text("Losses:  ");
			database.ref("matches/" + matchID).remove();
			database.ref("chats/" + matchID).remove();
			oppName = null;
			oppPlayerID = null;
			oppWins = null;
			oppLosses = null;
			matchID = null;
			chatID = null;
			turn = 1;
			$("#gameReadout").append("<h5>Please select an opponent to play against!</h5>");
			
			// Restore available players section.
			createPlayerEntry.currentPlayersDiv();
			
			// Change current window player's status back to inactive.
			database.ref("players/" + myPlayerID).set({"active": "false", "losses": 0, "name": myName, "wins": 0});
			database.ref("active/" + myPlayerID).remove();

			// Resync DB index values
			getInitialDBValues();	

		}
	});

	// Listens to DB "active" table new players added.  When a player becomes active, their button is removed from available players.
	database.ref("active").on("child_added", function(snapshot){
		var divID = snapshot.key;
		$("#" + divID).remove();
	});

	// Listen for players going from active to inactive to generate a button in the available player section.
	database.ref("active").on("child_removed", function(snapshot){
		
		// Grab snapshot of "players" table.
		database.ref("players").once("value", function(snapshot){
			
			// Regenerate all available player buttons.
			$(".playerButtons").remove();
			makeAllPlayerButtons(snapshot);
		
		});
	});

	// Listen to DB "matches" table for added match.  Run functions.
	database.ref("matches").on("child_added", function(snapshot){
		
		// Increment the currentMatchIndex to keep sync
		updateMatchIndex();

		// Check to see if the match involves subject player.  If so, set applicable opponent ID.
		if (snapshot.val().player2 === myPlayerID) {
			oppPlayerID = snapshot.val().player1;
			matchID = parseInt(snapshot.key);
			startMatch();
		}
	});
	
	// Listen to DB "chats" table for added chat.  Run functions.
	database.ref("chats").on("child_added", function(snapshot){
		
		// Increment currentChatIndex counter for accurate chatIDs added later.
		updateChatIndex();
		
		// Check if new child in chat DB table is from current match.  If so, set chatID.
		var childKey = parseInt(snapshot.key);
		if (childKey === matchID) {
			chatID = matchID;
		}

		// Check if chatListener already exists.
		if (chatListener == false) {	
			// Listen to DB (chats child) "messages" table for added message.  Run functions.
			database.ref("chats/" + chatID).on("child_added", function(snapshot){
				
				// Increment currentMessageIndex counter for accurate messageIDs added later.
				updateMessageIndex();
				
				var p = snapshot.val().name;
				var m = snapshot.val().message;
				var t = snapshot.val().time;
				var chatClass = "";
				
				// Check if message was generated by you or your opponent, assign appropriate class.
				if (p == myName) {
					chatClass = "chatMy";
				} else {
					chatClass = "chatOpp";
				}

				// Add chat message to chat display section
				$("#chatHistory").append("<span class=\"chatSpan\"><p class=\"timeStamp\">" + t + "</p><p class=\"" + chatClass + "\">" + p + ":&nbsp;&nbsp;&nbsp;" + m + "</p></span>");
				updateChatScroll();

			});

			// Set chatListener to exist.
			chatListener = true;

		}
	});
	
});
