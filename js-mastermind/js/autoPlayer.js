import {getCurrentSlots, getGameWonOrLost, askArtihuman, submitGuess, newGame} from "./main.js";
import {getNumberGameMoves} from "./artihuman.js";

export class AutoPlayer {

    constructor(no_games2play) {

        this.no_games2play = no_games2play;
        this._no_gamesLost = 0;
        this._no_gamesWon = 0;
        this._no_wonSteps = null;
        this._averageScore = null;
        this._winRate = null;

        this.artihuman_button = document.getElementById("artihuman");
        this.submit_button = document.getElementById("submit");
        this.restart_button = document.getElementById("restart");

    }

    generate_i = function*() {
        for (let i = 0; i <this.no_games2play; i++) {
            yield i;
        }
    }

    sleep (milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

    async play() {
       // this.suppressConsoleLog(true);
        for await (const i of this.generate_i()) {
            console.log("I Played ", i, " rounds");
            for (let k = 0; k < 9; k++) {
                //let lostWon = await getGameWonOrLost();
                if (await getGameWonOrLost() != null) {
                    //await this.stupid1(askArtihuman, submitGuess)
                    break;
                }
                    await askArtihuman();
                    //await this.sleep(50);
                    await submitGuess();
                    await this.sleep(50);

            }

            console.log("I AM HERE! Because I ", await getGameWonOrLost());
            switch (await getGameWonOrLost()) {
                case 'won':
                    this._no_gamesWon++;
                    this._no_wonSteps += getNumberGameMoves();
                    await document.getElementById('restartGame').click();
                    break;

                case 'lost':
                    this._no_gamesLost++;
                    await document.getElementById('restartGame').click();
                    break;
            }

          }
        this.calcAvgScore();
        this.calcWinRate();
        this.showResults();
        console.log(`AverageScore => ${this._averageScore} \n WinRate => ${this._winRate}`)
       // this.suppressConsoleLog(true);
    }

    calcAvgScore() {
        this._averageScore = Number(this._no_wonSteps/this._no_gamesWon).toFixed(3);
    }

    calcWinRate() {
        this._winRate = Number(this._no_gamesWon*100/(this._no_gamesWon+this._no_gamesLost)).toFixed(3);
    }

    showResults() {

        document.getElementById("autoPlayResults").innerHTML = '<h3 style="color:grey;">Results:</h3> ' +
            'AverageScore: ' + this._averageScore + '<br>' +
            'WinRate: ' + this._winRate;
    }

    suppressConsoleLog(suppress) {
        if(suppress){
            window.console.log = function() {};
        } else {
            window.console.log = window.console.log;

        }
    }

    disableAllButtons(disable) {
        document.getElementsByClassName("extraButton").disabled = disable;
    }


    get no_gamesLost() {
        return this._no_gamesLost;
    }
    get no_gamesWon() {
        return this._no_gamesWon;
    }
    get no_wonSteps() {
        return this._no_wonSteps;
    }
    get averageScore() {
        return this._averageScore;
    }
    get winLooseRatio() {
        return this._winRate;
    }


}

