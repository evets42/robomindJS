class Tracker{
    constructor(){
        this.gameID = null;
        this.playerName = '';
        this.won = null;
        this.rounds = [];
        this.hints = []
        this.turnTimes = []
        this.addRound = function (roundGuess) {
            if (!(roundGuess in this.rounds)) {
                this.rounds.push(roundGuess)
            }
            console.log(`Round Added. Current rounds:${this.rounds}`)
        };
        this.addTurnTime = function (turnTime) {
            if (!(roundGuess in this.rounds)) {

            }
            this.turnTimes.push(turnTime);
            console.log(`TurnTime Added. Current times:${this.rounds}`)
        }

        this.write2File = function () {
        };
    }
}
module.exports.Tracker = Tracker;