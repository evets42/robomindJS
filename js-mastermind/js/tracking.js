export default class {

    constructor() {
        this.gameID = ""
        this.playerName = ""
        this.won = ""
        this.game = {}
        this.rounds = {}
        this.hints = {}
        this.turnTimes = {}
        this.feedback = {}
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

    saveGameTracker() {
        //  this.game[this.gameID] = (this.won, this.rounds, this.turnTimes, this.hints);
    }

    clearTemp() {
        this.won = null;
        this.rounds = {};
        this.hints = {};
        this.turnTimes = {};
    }

    write2File() {
        this.gameData = {
            gameID: this.gameID,
            playerName: this.playerName,
            won: this.won,
            noRounds: this.rounds.length,
            rounds: this.rounds,
            turnTimes_ms: this.turnTimes,
            hints: this.hints
        };

        localStorage.setItem('GameData', JSON.stringify(this.gameData));
        this.clearTemp();
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
        saveBlob(blob, `${this.gameID}_gameData.json`);
    }

}
//module.exports.Tracker = Tracker;