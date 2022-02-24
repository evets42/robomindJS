// Import the functions you need from the SDKs you need
import {initializeApp} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";

// https://firebase.google.com/docs/web/setup#available-libraries
import {getDatabase, ref, set, onValue, get, child, update, remove, orderByKey} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-database.js"

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC9sRbGfIkkWDNjjlRKh-4WNDuSGIgUsec",
    authDomain: "robomind-tracking.firebaseapp.com",
    databaseURL: "https://robomind-tracking-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "robomind-tracking",
    storageBucket: "robomind-tracking.appspot.com",
    messagingSenderId: "992842688045",
    appId: "1:992842688045:web:a7e89ab5e9419fb8adbaa4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase();
const dbRef = ref(db);

export default class {


    constructor() {
        this.gameId = null;
        this.playerName = null;
        this.won = null;
        this.game = {}
        this.rounds = {}
        this.hints = {}
        this.turnTimes = {}
        this.feedback = {}
        this.userId = 0;
    }

    addRound(noRound, roundGuess) {
        if (!(noRound in this.rounds)) {
            this.rounds[noRound] = roundGuess;
        }
        console.log(`Round Added. Current rounds:${JSON.stringify(this.rounds)}`);
    }

    addTurnTime(noRound, startTime, endTime) {
        if (!(noRound in this.turnTimes)) {
            this.turnTimes[noRound] = Math.round(endTime - startTime);
        }
        console.log(`TurnTime Added. Current times:${JSON.stringify(this.turnTimes)}`);
    }

    addHint(noRound, hint) {
        if (!(noRound in this.hints)) {
            this.hints[noRound] = hint;
        }
        console.log(`Hint Added. Current hints:${JSON.stringify(this.hints)}`);
    }

    addFeedback(noRound, feedback) {
        if (!(noRound in this.feedback)) {
            this.feedback[noRound] = feedback;
        }
        console.log(`Feedback Added. Current Feedback:${JSON.stringify(this.feedback)}`);
    }

    clearTemp() {
        this.won = null;
        this.noRounds = 0;
        this.rounds = {};
        this.hints = {};
        this.turnTimes = {};
        this.feedback = {};
    }

    //Read last userId from database
    async readLastUserId() {
        //let iD = this.userId;
        let temp = await get(child(dbRef, `last_userId`))
            .then(snapshot => {
            if (snapshot.exists()) {
                console.log("readLastUserId temp: "+snapshot.val());
                return snapshot.val();
            } else {
                    console.log("last userId could not be read");
            }
            })
            .then(temp => {return temp;})
            .catch((error) => {console.error(error)});
        return temp;
    }

    // Read in userId from entered PlayerName in Database -
    async readUserId() {
        console.log("this.playerName: "+this.playerName);
        let temp = await get(child(dbRef, `name_id_mapping/${this.playerName}`))
            .then((snapshot) => {
            if (snapshot.exists()) {
                console.log(snapshot.val());
                return snapshot.val();
            } else {
                //If PlayerName does not exist, create new User Id
                console.log("Player name does not exist");
                return "unknown";
            }
            }).catch((error) => {
                console.error(error);
            });
            if(temp == "unknown") {
                console.log("inside of unknown");
                temp = await this.readLastUserId() + 1;
                this.writeLastUserId2Database(temp);
                this.writeUserId2Database(temp );
            }
        console.log("this is temp: "+ temp);
        return temp;
    }

    async readLastGameId(userId) {
        let temp = await get(child(dbRef, `game_data/${userId}/last_gameId`)).then(snapshot => {
            if (snapshot.exists()) {
                console.log(`last_game_id from ${userId} = ` +snapshot.val());
                //Return userId of PlayerName
                return(snapshot.val());
            } else {
                //If UserId does not have last_gameId set to 1
                console.log("This userId does not have a last_gameId");
                console.log("Set gameId to 0");
                return(0);
            }
        }).catch((error) => {
            console.error(error);
        });
        console.log("last game Id: "+temp);
        return temp;
    }

    writeLastGameId2Database(userId) {
        set(ref(db, `game_data/${userId}/last_gameId`), this.gameId);
    }

    writeLastUserId2Database(user_Id) {
        set(ref(db, 'last_userId/'), user_Id);
    }

    writeUserId2Database(userId) {
        set(ref(db, 'name_id_mapping/'+this.playerName), userId)
            .catch(error => {console.log(error)});
    }

    write2Database() {
        console.log(`userId: ${this.userId} and gameId: ${this.gameId}`)
        let no_rounds = null
        if(this.rounds.length == null) {
            no_rounds = 0;
        } else {
            no_rounds = this.rounds.length;
        }
        set(ref(db, `game_data/${this.userId}/${this.gameId}`), {
            playerName: this.playerName,
            gameId: this.gameId,
            won: this.won,
            rounds: this.rounds,
            turnTimes_ms: this.turnTimes,
            hints: this.hints,
            feedback: this.feedback
        });
        //Write last_gameId
        console.log(`I write the last_gameId: ${this.gameId} from user: ${this.userId} to DB`)
        set(ref(db, `game_data/${this.userId}/last_gameId`), this.gameId);
    }

    write2File() {
        this.gameData = {
            gameId: this.gameId,
            playerName: this.playerName,
            won: this.won,
            rounds: this.rounds,
            turnTimes_ms: this.turnTimes,
            hints: this.hints,
            feedback: this.feedback
        };
        localStorage.setItem('GameData', JSON.stringify(this.gameData));
    }

    downloadFile() {
        let blob = new Blob([JSON.stringify(this.gameData, null, 2)], { type: 'application/json' });

        var saveBlob = (function () {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            return function (blob, fileName) {
                var url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            };
        }());
        saveBlob(blob, `${this.gameId}_gameData.json`);

        this.clearTemp();
    }

}
