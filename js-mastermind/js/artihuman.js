import {getCurrentSlots, getArtiHumanOptions} from "./main.js";


const pegs = {
    1: 'green',
    2: 'purple',
    3: 'red',
    4: 'yellow',
    5: 'blue',
    6: 'brown'
};
const reverse_pegs = {
    'green': 1,
    'purple': 2,
    'red': 3,
    'yellow': 4,
    'blue': 5,
    'brown': 6
}

//create a memory dict for every color
let memory = await buildMemory(pegs);

let numberGameMoves = 0;
let numberArtiMoves = 0;

// Create solutionSpace with 1296 (6^4) combinations
let solutionSpace = await printAllKLength([1, 2, 3, 4, 5, 6], 4);
let solutionSet = new Set(solutionSpace);

//console.log(Array.from(solutionSpace[0]));
//console.log(([1, 2, 3, 4, 5, 6]).join(''));

let artiHumanOptions = getArtiHumanOptions();

// Todo otherwise : count hints (how many b how many w)

async function buildMemory(pegs) {
    let temp_memory = {};
    for (let key in pegs) {
        temp_memory[key] = {
            isInSecret: false,    // Color is certainly in the secret
            maybeInSecret: false,   // Color was played at least once and might be in the secret
            notInSecret: false, // Color is certainly not in the secret
            whites: [0, 0, 0, 0], // Memorize how many white hints were received for the color in that position
            blacks: [0, 0, 0, 0], // Memorize how many black hints were received for the color in that position
            inPosition: [0, 0, 0, 0], // +1 is definitely on this position, 0 no information, -1 definitely NOT in this position
        }
    }
    //Initialize storage for used Combinations [0] + hint answers [1] ([0] = b, [1] = w)
    // e.g.
    // Round1 = 1,2,3,4 -> b,w,w
    // Round2 = 3,4,5,6 -> b,w
    //temp_memory['playedCombinations'] = [[1,2,3,4],[3,4,5,6]]   <- colors
    //                                  [[1,2],[1,1]]   <- b,w HINTS
    temp_memory['dumpCombinations'] = [[], []];

    //If white and black hints add up to 4, all of the colors HAVE to be in the secret code -> save them
    temp_memory['correctColors'] = [[], []];

    //Memorize the best guess as bestGuess:[colorId,colorId,colorId,colorID],[b,w]]
    temp_memory['bestGuess'] = [[0, 0, 0, 0], [0, 0]];

    //Memorize the amount of colors in the code
    temp_memory['amountColor'] = [-1, -1, -1, -1, -1, -1];

    //Memorize which strategy was played at which move
    // 'single' || 'AABB' || 'random'
    temp_memory['strategy'] = [];

    return temp_memory;
}

function printAllKLength(set, k) {
// Javascript program to print all
// possible strings of length k
    return new Promise((resolve) => {
        let n = set.length;
        let result = [];
        printAllKLengthRec(result, set, "", n, k);
        resolve(result);
    })

}

function printAllKLengthRec(result, set, prefix, n, k) {

    // Base case: k is 0,
    // print prefix
    if (k == 0) {
        result.push(prefix);
        // document.write(prefix+"<br>");
        return;
    }

    // One by one add all characters
    // from set and recursively
    // call for k equals to k-1
    for (let i = 0; i < n; ++i) {

        // Next character of input added
        let newPrefix = prefix + set[i];

        // k is decreased, because
        // we have added a new character
        printAllKLengthRec(result, set, newPrefix,
            n, k - 1);
    }
}

export function analyzeInputRows(inputRows, hintStorage) {
    let numberGameMoves_bool = false;
    for (let k = inputRows.length - 1; k >= 0; k--) {

        let currentSlots = inputRows[k].getElementsByClassName('socket');
        let currentHints = hintStorage[k];
        // console.log('currentHints: ',currentHints);

        let {b, w} = countBandW(currentHints);
        //console.log(`row ${k} - b: ${b} / w: ${w}`)
        let currentRow = [];
        for (let i = 0; i <= currentSlots.length; i++) {
            let counter_numberGameMoves = inputRows.length - k;
            if (currentSlots[i] != null && currentSlots[i].className === 'socket' && !numberGameMoves_bool) {
                numberGameMoves = counter_numberGameMoves;
                numberGameMoves_bool = true;
                //console.log("numberGameMoves: ", numberGameMoves);
            }
            if (currentSlots[i] != null && currentSlots[i].className !== 'socket') {
                //console.log('currentSlots[i]: ',currentSlots[i].className)
                let color = currentSlots[i].className.substring(11)
                let colorId = reverse_pegs[color];

                currentRow.push(colorId);
                //console.log('currentRow In Loop => ', currentRow);
                //console.log('colorId: ',colorId);
                //memory[colorId]['notInSecret'] = true;
                // If no black or white hints - all colors are definitely not in the secret
                if (b === 0 && w === 0) {
                    memory[colorId]['notInSecret'] = true;
                    memory[colorId]['maybeInSecret'] = false;
                } else {
                    // Check if color is already certainly not in the secret, if not: continue
                    if (memory[colorId]['notInSecret'] === false) {
                        // If black or white pegs together are 4, then all colors of this round are certainly in the secret
                        if (b + w === 4) {
                            //console.log("BandW = ",b," ",w);
                            memory[colorId]['isInSecret'] = true;
                            memory['correctColors'][0][i] = colorId;
                            if (i === 0) {
                                memory['correctColors'][1] = [b, w];
                            }

                            //console.log("correctColors are",JSON.stringify(memory['correctColors'], null, 2));
                        }
                        if (b == 0 && w >= 0) {
                            memory[colorId]['inPosition'][i] = -1;
                        }

                        // If a color was in a combination which received mor than 0 black or white it might be in the code
                        // Flag, that color was used
                        memory[colorId]['maybeInSecret'] = true;

                        // Add amount of black and white hints the color received in its current position
                        memory[colorId]['blacks'][i] = parseInt(memory[colorId]['blacks'][i]) + b;
                        memory[colorId]['whites'][i] = parseInt(memory[colorId]['whites'][i]) + w;
                        //console.log(`memory: ${memory[1]['whites']}`);
                        //console.log(`memory: ${memory[1]['blacks']}`);
                    }
                }
            }
        }
        //console.log(`currentRow AFTER => `, currentRow); BUG?

        if (currentRow.length !== 0) {
            console.log(`currentRow => ${currentRow}`);
            console.log(`checkIfGuessWasUsed(currentRow) => ${checkIfGuessWasUsed(currentRow)}`);
            if (checkIfGuessWasUsed(currentRow)) {
                continue;
            } else {

                //Put current guess in dumpCombinations
                memory['dumpCombinations'][0].push(currentRow);
                memory['dumpCombinations'][1].push([b, w]);

                if (testIfSingleWith(currentRow)) {
                    memory.strategy[numberGameMoves - 1] = 'single'
                    //Because it is single color row we write amount of color to memory
                    memory['amountColor'][currentRow[0] - 1] = b + w;
                    //Get last played row
                    //console.log(`memory.playedCombinations[0]whole => ${memory.playedCombinations[0]}`);
                    let beforePlayedRow = memory.dumpCombinations[0].at(-2);
                    let beforePlayedHints = memory.dumpCombinations[1].at(-2);

                    console.log(`memory.dumpCombinations[0][last] => ${beforePlayedRow}`);
                    console.log(`memory.dumpCombinations[1][last] => ${beforePlayedHints}`);
                    //Test if the row played before has AABB, if so, return the other color
                    // and write amount of colors (difference) to memory
                    let beforePlayedColorB = testIfAABBWith(currentRow[0], beforePlayedRow);
                    if (beforePlayedColorB !== -1) {
                        console.log('beforePlayedColorB => ', beforePlayedColorB);
                        // Find the color in memory and tell it the amount
                        memory['amountColor'][beforePlayedColorB - 1] = (beforePlayedHints[0] + beforePlayedHints[1]) - (b + w);

                        if (beforePlayedHints - (b + w) === 0) {
                            // if difference between the playedRows is zero, mark colorB (beforePlayedColorB) as not present in the code
                            memory[beforePlayedColorB].notInSecret = true;
                        }
                    }
                }
                diminishSolutionSpace(currentRow, b, w);
            }
        }
    }
    //console.log(JSON.stringify(memory, null, 2));
    console.log('memory.amountColor: ', JSON.stringify(memory.amountColor, null, 2));
    //console.log('memory.pegs')
    //console.log(JSON.stringify(memory.amountColor, null, 2));
}

function nextGuess_v2() {
    artiHumanOptions = getArtiHumanOptions();
    let possibleColors = null;
    if (memory['correctColors'][0].length === 0) {
        //("correctColors == 0");
        possibleColors = setOfValidColors();
    } else {
        //console.log("correctColors is this", memory['correctColors']);
        possibleColors = memory['correctColors'][0];
    }
    //let artiHumanGuess = guessRandom(possibleColors);

    if (artiHumanOptions.includes('ruleOutColors')) {
        let hannesGuess = ruleOutColors(possibleColors)
        console.log("Last strategy: ", memory.strategy);
        return hannesGuess;
    }


    if(numberGameMoves === 1) {
        return playAABB(possibleColors);
    } else {
        return drawRandomFromSolutionSet();
    }


}

function guessOnEvidence(possibleColors) {
    let finalGuess = [0, 0, 0, 0];
    let counter = [0, 0, 0, 0]
    for (let i = 0; i < finalGuess.length; i++) {
        for (let key in pegs) {
            if (memory[key]['notInSecret'] === false) {
                // blacks have higher factor 2 weight than whites // 1.5 is just a gut feeling
                let sumOfBandW = 1.5 * parseFloat(memory[key]['blacks'][i]) + parseFloat(memory[key]['whites']);

                if (counter[i] < sumOfBandW) {
                    finalGuess[i] = parseInt(key);
                    counter[i] = sumOfBandW;
                }
                //console.log(`i: ${i}, Key: ${key}, finalGuess: ${finalGuess}, counter: ${counter}, sumOfBandW: ${sumOfBandW}`)
            }
        }
    }
    // Check if guess was already played, if yes, choose random socket to replace with random valid color
    while (checkIfGuessWasUsed(finalGuess)) {
        let outSocket = Math.floor(Math.random() * 4);
        finalGuess[outSocket] = guessRandom(possibleColors)[outSocket];
    }

    return finalGuess;
}

function guessOnEvidence_v2(possibleColors) {
    let finalGuess = [0, 0, 0, 0];
    let counter = [0, 0, 0, 0]


    //TODO SAVE THE HINTS IN WHICH CORRECT COLORS OCCURRED ->
    // how many B and W? -> How many sockets are to change
    //->


    //TODO CREATE KIND OF A GUESS RANKING: Which guess got the most correct hints so far?


    for (let i = 0; i < finalGuess.length; i++) {
        for (let key in pegs) {
            // Check if this color is in secret
            if (memory[key]['notInSecret'] === false) {
                if (memory[key]['inPosition'][i] === 1) {
                    finalGuess[i] = key;
                } else if (memory[key]['inPosition'][i] === -1) {
                    continue;
                } else {
                    // blacks have higher factor than whites // 1.5 is just a gut feeling
                    let sumOfBandW = 1.5 * parseFloat(memory[key]['blacks'][i]) + parseFloat(memory[key]['whites']);

                    if (counter[i] < sumOfBandW) {
                        finalGuess[i] = parseInt(key);
                        counter[i] = sumOfBandW;
                    }
                    //console.log(`i: ${i}, Key: ${key}, finalGuess: ${finalGuess}, counter: ${counter}, sumOfBandW: ${sumOfBandW}`)
                }
            }
        }
    }
    // Check if guess was already played, if yes, check which positions are not certain
    // -> choose random socket to replace with random valid color
    while (checkIfGuessWasUsed(finalGuess)) {
        let uncertainPositions = [];
        for (let i = 0; i < finalGuess.length; i++) {
            // Evaluate which positions are not certain (no Information if color here is correct or not)
            if (memory[finalGuess[i]]['inPosition'][i] === 0) {
                uncertainPositions.push(i);
            }
        }
        // Pick random position from uncertainPositions list as the socket to change
        let outSocket = uncertainPositions[Math.floor(Math.random() * uncertainPositions.length)];
        // Generate random color from possible colors and add it to finalGuess
        finalGuess[outSocket] = guessRandom_v2(possibleColors)[outSocket];
    }
    return finalGuess;
}

function guessOnShuffle() {
    // TODO BUGS: Uses already used combinations --> implement something

    // TODO CHECK IF CORRECT COLORS = 4 THEN USE THEM
    //      IF NOT USE THE LAST BEST GUESS
    //      Change IF correctcolors === 4 TO something better


    //console.log("length of correctColors: ", memory['correctColors'][0].length);
    if (memory['correctColors'][0].length === 4) {

        // This is our empty basis
        let guessBasis = [0, 0, 0, 0];

        // In here we will save the finalGuess we will return
        let finalGuess = [];

        // How many slots do we need to change? -> Depends on number of black slots
        let noSlotsToChange = guessBasis.length - memory['correctColors'][1][0];

        // Take last guess with all correct colors as basis
        guessBasis = memory['correctColors'][0].slice(0);

        // Set loop count, we keep track how often we go through the process, so we can do different things every iteration
        let loopCount = 0;

        // In this array we save all slots which are are not 100% certain
        let availableSlots = [];

        // In this array we save all slots which are 100% certain and should not be changed
        let frozenSlots = new Set();

        // Fill available Slots and frozen slots arrays
        for (let i = 0; i < guessBasis.length; i++) {
            // If we are certain, that this Slot is correctly set, then freeze it (don't change it)
            if (memory[memory['correctColors'][0][i]]['inPosition'][i] === 1) {
                frozenSlots.add(i);
            } else {
                availableSlots.push(i);
            }
        }

        // Transfer frozen slots in finalGuess
        frozenSlots.forEach(element => {
            finalGuess[element] = guessBasis[element]
        });

        // In this Set we keep track how many Slots we changed
        let changedSlots = new Set();

        // Set random start to do something different every loop
        let changeSlotA = availableSlots[Math.floor(Math.random() * availableSlots.length)];

        //console.log(`My random start is: ${changeSlotA}`);
        //console.log(`My availableSlots ${availableSlots}`);


        let loopyLoop = 0;

        while (availableSlots.length !== 0 && changedSlots.size < noSlotsToChange && loopyLoop < 10) {
            loopyLoop++;
            for (let i = (changeSlotA + 1) % guessBasis.length; i < guessBasis.length; i++) {

                let k = i % guessBasis.length;
                //console.log(`i: ${i} and k:${k}`);
                //console.log(`changedSlots ${Array.from(changedSlots.values())}`);

                // random Start - go through available Slots and search for a suitable changeSlotB
                // Criteria: changeSlotB is not frozen && the color from SlotB can be in SlotA
                if (!frozenSlots.has(k) &&
                    memory[guessBasis[changeSlotA]]['inPosition'][k] !== -1 &&
                    changedSlots.size < noSlotsToChange && guessBasis[changeSlotA] !== guessBasis[k]) {

                    finalGuess[changeSlotA] = guessBasis[k];
                    finalGuess[k] = guessBasis[changeSlotA];
                    availableSlots.splice(changeSlotA, 1)
                    changedSlots.add(changeSlotA);
                    changedSlots.add(k);
                    //console.log(`changedSlots ${changedSlots.size} < ${noSlotsToChange} noSlotsToChange`);
                    //console.log(`I change [${changeSlotA}]->${pegs[guessBasis[changeSlotA]]} with [${k}]->${pegs[guessBasis[k]]}`);
                    //console.log(`These are the changedSlots ${Array.from(changedSlots.values())}`);
                    //console.log(`I still have ${noSlotsToChange-changedSlots.size} pins to change`);


                    if (availableSlots.length !== 0) {
                        changeSlotA = availableSlots[0];
                    }
                }
            }
        }
        //console.log(`%cfinalGuess before FILL is: ${finalGuess}`, 'color: red;');
        // Fill up the slots which were not changed
        for (let m = 0; m < guessBasis.length; m++) {
            if (!changedSlots.has(m)) {
                finalGuess[m] = guessBasis[m];
            }
        }


        //console.log(`%cfinalGuess @ end is: ${finalGuess}`, 'color: green;');

        if (checkIfGuessWasUsed(finalGuess)) {
            finalGuess = guessOnShuffle();
        }

        return finalGuess;


        /*
                do {
                    // How many pins have to be changed?
                    let noPinsToChange = memory['correctColors'][1][1];
                    console.log(`LoopLoop: ${loopCount}`);
                    // Loop through the guess number of pins to change minus 1 times
                    let changedSlots = [];
                    for (let i = 0; i < guessBasis.length; i++) {
                        console.log(`I changed these slots: ${changedSlots}`);
                        // Check if we know that the pin we want to change is certainly in this position
                        // AND the slot was not changed before
                        if (memory[memory['correctColors'][0][i]]['inPosition'][i] === 1 || changedSlots.includes(i)) {
                            console.log(`with ${i} I continue`)
                            continue;
                        } else {
                            console.log(`with ${i} I go into else`)
                            // From the slot to change, go right in the guessBasis list and search for a color which is possible for this slot
                            // --> change those 2 slots
                            // Start from 1 slot to the right, if the guess was already used
                            let loopCount_i = i + loopCount;
                            console.log(`It is ${loopCount} and +i it is ${loopCount_i}`);

                            while (noPinsToChange > 0) {
                                if (changedSlots.includes(i)) {
                                    console.log(`I break loop because ${i} is in ${changedSlots}`);
                                    break;
                                }
                                let changeSet = new Set([0,1,2,3]);
                                changeSet.delete(i);


                                let changeSlotA = i;
                                let changeColorA = guessBasis[changeSlotA];
                                let changeSlotB = changeSet[Math.floor(Math.random() * changeSet.size)];
                                let changeColorB = guessBasis[changeSlotB];



                                if (memory[guessBasis[changeSlotB]]['inPosition'][changeSlotA] !== -1 &&
                                    memory[guessBasis[changeSlotA]]['inPosition'][changeSlotB] !== -1) {

                                    console.log(`I change slot ${changeSlotA} color: ${guessBasis[i]} with slot ${changeSlotB} color: ${guessBasis[k]}`);
                                    console.log(`I still have ${noPinsToChange} pins to change`);

                                    // Switch color to other slot
                                    guessBasis[changeSlotA] = changeColorB;
                                    guessBasis[changeSlotB] = changeColorA;

                                    noPinsToChange = noPinsToChange-2;

                                    // remember which pins changed
                                    changedSlots.push(changeSlotA);
                                    changedSlots.push(changeSlotB);

                                }
                            }
                        }
                        loopCount++;
                    }
                    // Emergency exit for while loop --> algorithm cannot determine the solutions left
                    if (loopCount >= 6) {
                        console.log(`I take the emergency exit`);
                        break;
                    }
                    console.log(`%cfinalGuess @ end of while loop is: ${guessBasis}`, 'color: green;');
                } while (checkIfGuessWasUsed(guessBasis))
                return finalGuess;
        */
    }
}

function guessRandom(possibleColors) {
    let randomGuess = [];
    // console.log(possibleColors, randomGuess)
    console.log('possibleColors: ', possibleColors);
    for (let i = 0; i < 4; i++) {
        randomGuess[i] = possibleColors[Math.floor(Math.random() * possibleColors.length)];
        //console.log(possibleColors, randomGuess)
        //console.log("randomGuess: ", randomGuess);
    }
    return randomGuess;
}

function guessRandom_v2(possibleColors) {
    let randomGuess = [];
    for (let i = 0; i < 4; i++) {
        do {
            randomGuess[i] = possibleColors[Math.floor(Math.random() * possibleColors.length)];
        } while (memory[randomGuess[i]]['inPosition'][i] === -1);
    }
    return randomGuess;
}

async function drawRandomFromSolutionSet() {
    console.log("This is SolutionSet: ", solutionSet);
    let solutionArray = Array.from(solutionSet);
    let drawnGuess = solutionArray[Math.floor(Math.random() * solutionArray.length)];

    drawnGuess = drawnGuess.split("").map(Number);

    return drawnGuess;
}

function diminishSolutionSpace(colorCombination, originalB, originalW) {

    if (getArtiHumanOptions().length === 0){
        return;
    }
    let originalBW = [originalB, originalW];

    solutionSet.forEach(guess => {
        // Transform guess from 1234 to [1,2,3,4]
        guess = guess.split("").map(Number);
        let amountInCode = 0;
        let copyCorrectColors = memory['correctColors'][0].slice(0);
        console.log(`Current guess => ${guess}`);

        // Check if other codes were the solution if the played code would give the same response
        if (artiHumanOptions.includes('consistency')) {
            // Compare all (remaining) guesses from solution space against the last played colorCombination
            // Those, which will not give the same result as we got from the last played colorCombination
            // against the real secret code are not consistent with the solution
            // --> Delete all those, which do not return the same result in b and w
            if (checkHintConsistency(guess, colorCombination, originalBW)) {
                if (solutionSet.delete(guess.join(''))) {
                    console.log(`I deleted ${guess} because consistency - Remaining #Solutions = ${solutionSet.size}`);
                }
            }
        }


        // Check for valid positioning
        let amountColors = [0, 0, 0, 0, 0, 0];

        for (let i = 0; i < guess.length; i++) {

            // add color to amountColors
            amountColors[guess[i] - 1]++;
            // console.log('amountColors => ', amountColors);
            // console.log("guess[i] ",[i]," ", guess[i]);
            // console.log("Memory IN position",memory[guess[i]]['inPosition']);
            // console.log("memory[guess[i]]['inPosition'][i] => ",memory[guess[i]]['inPosition'][i]);
            if (memory[guess[i]]['inPosition'][i] === -1) {
                //console.log("I will delete! ", guess);
                if (solutionSet.delete(guess.join(''))) {
                    console.log(`I deleted ${guess} because ${guess[i]} can not be in Position ${i}
                    - Remaining #Solutions = ${solutionSet.size}`)
                    break;
                }
            }

            // Check if color is in the code
            if (memory[guess[i]]['notInSecret']) {
                if (solutionSet.delete(guess.join(''))) {
                    console.log(`memory[guess[i].notInSecret => ${memory[guess[i]].notInSecret} `);
                    console.log(`I deleted ${guess} because ${pegs[guess[i]]} is not in the code
                    - Remaining #Solutions = ${solutionSet.size}`)
                    break;
                }
            }
            // Check if correct Colors
            if (memory['correctColors'][0].length === 4) {
                console.log(`copyCorrectColors.indexOf(guess[${i}]) with guess[${i}] = ${guess[i]} =>  ${copyCorrectColors.indexOf(guess[i])}`)
                let indexOfPegInCorrectColors = copyCorrectColors.indexOf(guess[i]);
                if (indexOfPegInCorrectColors === -1) {
                    if (solutionSet.delete(guess.join(''))) {
                        console.log(`I deleted ${guess} because ${pegs[guess[i]]} it does not match with correctColors
                        ${memory['correctColors'][0]} (copy: ${copyCorrectColors}) - Remaining #Solutions = ${solutionSet.size}`)
                        break;
                    }
                } else {
                    copyCorrectColors[indexOfPegInCorrectColors] = -1;
                    //console.log(`I set copyCorrectColors[${i}] to -1 => ${copyCorrectColors}`);
                }
            }
        }

        //If hint is b > 0, count how many has test-guess in common with last guess
        //This count has to be count >= b, otherwise delete the guess
        if (memory.dumpCombinations[1].at(-1)[0] > countSimilarity(guess, memory.dumpCombinations[0].at(-1))) {
            if (solutionSet.delete(guess.join(''))) {
               console.log(`I deleted ${guess} because b > similar ${guess}:${memory.dumpCombinations[0].at(-1)}
               => ${memory.dumpCombinations[1].at(-1)[0]} ${countSimilarity(guess, memory.dumpCombinations.at(-1))}
                - Remaining #Solutions = ${solutionSet.size}`);
            }
        }


        // Compare the amount of colors we know in memory with the amount of colors from the current guess
        // If not the same: delete guess from solution space
        for (let k = 0; k < amountColors.length; k++) {
            //console.log('This is k => ', k);
            //console.log(`Current guess => ${guess}, amountColors => ' ${amountColors}`);
            //console.log('amountColors => ', amountColors);
            //console.log('memory.amountColor => ', memory.amountColor);
            // If we dont have information on amount of colors (==-1)
            //      OR we counted 0 in current guess then skip (gets deleted elsewhere)
            //console.log(`For guess ${guess}, on k${k} memory.amountColors => ${memory.amountColor}`);
            if (memory.amountColor[k] === -1) {
                continue;
            } else {
                //console.log(`For guess ${guess}, on ${k} => amountColors[k] !== memory.amountColor[k] => ${amountColors[k]} !== ${memory.amountColor[k]}`);
                if (amountColors[k] !== memory.amountColor[k]) {
                    if (solutionSet.delete(guess.join(''))) {
                        console.log(`I deleted ${guess} because it has ${amountColors[k]} and not ${memory.amountColor[k]} of ${pegs[k+1]}
                        - Remaining #Solutions = ${solutionSet.size}`)
                    }
                }
            }
        }
    })

    // also delete the played colorCombination from the solution space
    console.log('I deleted current guess colorCombination from solution space:', solutionSet.delete(colorCombination.join('')));
    console.log('Solution Space size: ', solutionSet.size);
    if (solutionSet.size === 0) {
        console.log('memory.amountColor: ', JSON.stringify(memory.amountColor, null, 2));
        //throw Error('ArtiHuman: "Something went wrong. I deleted to much, I do not have any solutions left"');
    }
}

function checkHintConsistency(basisGuess, basisColorCombination, originalBW) {

    let colorCombination = basisColorCombination.slice(0);
    let guess = basisGuess.slice(0);

    //let checkHints = [];
    let b = 0;
    let w = 0;
    let kickOut = true;

    //console.log(`PlayedCode = ${colorCombination}, TryCode = ${guess}`);

    // First check if there are any pegs that are the right color in the right place
    for (let i = 0; i < colorCombination.length; i++) {
        if (guess[i] === colorCombination[i]) {
            colorCombination[i] = 0;
            guess[i] = -1;
            //checkHints.push('b');
            b++;
        }
    }

    // Then check if there are any pegs that are the right color but NOT in the right place
    for (let j = 0; j < colorCombination.length; j++) {
        if (colorCombination.indexOf(guess[j]) !== -1) {
            //checkHints.push('w');
            colorCombination[colorCombination.indexOf(guess[j])] = 0;
            w++;
        }
    }

    if (b + w === originalBW[0] + originalBW[1]) {
        kickOut = false;
    }

    return kickOut;
}

function countSimilarity(testGuess, guess) {
    let count = 0;
    for (let i = 0; i < guess.length; i++) {
        if (testGuess[i] == guess[i]) {
            count++;
        }
    }
    return count;
}

function ruleOutColors(possibleColors) {
    console.log("I Rule out colors!")
    console.log("numberGameMoves =>", numberGameMoves);
    switch (numberGameMoves) {
        case 1:
            memory.strategy[numberGameMoves - 1] = 'AABB';
            return playAABB(possibleColors);
        case 2:
            console.log("I am in case2: ");
            if (memory.strategy.at(-1) === 'AABB') {
                // Test for amount of colors, if first move returned b + w > 0, then single color, if not then repeat
                //console.log(`%cRound ${numberGameMoves}: memory.dumpCombinations[1][0] => ${memory.dumpCombinations[1][0]}`, 'color: green;');
                if (memory.dumpCombinations[1].at(-1)[0] + memory.dumpCombinations[1].at(-1)[1] > 0) {
                    memory.strategy[numberGameMoves - 1] = 'single';
                    console.log("I am in case2 and play single")
                    return playSingleColorOf(memory.dumpCombinations[0].at(-1)[0], memory.dumpCombinations[0].at(-1)[2]);
                } else {
                    memory.strategy[numberGameMoves - 1] = 'AABB';
                    console.log("I am in case2 and play AABB")
                    return playAABB(possibleColors);
                }
            }
        case 3:
            if (memory.strategy.at(-1) === 'AABB') {
                // Test for amount of colors, if first move returned b + w > 0, then single color, if not then repeat
                //console.log(`%cRound ${numberGameMoves}: memory.dumpCombinations[1][0] => ${memory.dumpCombinations[1][0]}`, 'color: green;');
                if (memory.dumpCombinations[1].at(-1)[0] + memory.dumpCombinations[1].at(-1)[1] > 0) {
                    memory.strategy[numberGameMoves - 1] = 'single';
                    return playSingleColorOf(memory.dumpCombinations[0].at(-1)[0], memory.dumpCombinations[0].at(-1)[2]);
                } else {
                    memory.strategy[numberGameMoves - 1] = 'AABB';
                    return playAABB(possibleColors);
                }
            } else if (memory.strategy.at(-1) === 'single') {
                memory.strategy[numberGameMoves - 1] = 'AABB';
                let returnGuess;
                //Check if colors have already been played
                //Only use colors which have not been played so far
                for (let m = 0; m < 50; m++) {
                    returnGuess = playAABB(possibleColors)
                    if ((!memory[returnGuess[0]]['maybeInSecret'] && !memory[returnGuess[2]]['maybeInSecret'])) {
                        break;
                    }
                }
                return returnGuess;
            }

        case 4:
            if (memory.strategy.at(-1) === 'AABB') {
                // Test for amount of colors, if first move returned b + w > 0, then single color, if not then repeat
                //console.log(`%cRound ${numberGameMoves}: memory.dumpCombinations[1][0] => ${memory.dumpCombinations[1][0]}`, 'color: green;');
                if (memory.dumpCombinations[1].at(-1)[0] + memory.dumpCombinations[1].at(-1)[1] > 0) {
                    memory.strategy[numberGameMoves - 1] = 'single';
                    return playSingleColorOf(memory.dumpCombinations[0].at(-1)[0], memory.dumpCombinations[0].at(-1)[2]);
                } else {
                    memory.strategy[numberGameMoves - 1] = 'AABB';
                    return playAABB(possibleColors);
                }
            } else if (memory.strategy.at(-1) === 'single') {
                memory.strategy[numberGameMoves - 1] = 'AABB';
                return playAABB(possibleColors);
            }


        default:
            console.log(`I should be in case: ${numberGameMoves}`);
            memory.strategy.push('random')
            return drawRandomFromSolutionSet();

    }


}

function playSingleColorOf(colorId, alternativeColorId) {
    if (checkIfGuessWasUsed([colorId, colorId, colorId, colorId])) {
        return [alternativeColorId, alternativeColorId, alternativeColorId, alternativeColorId];
    }
    return [colorId, colorId, colorId, colorId];
}

function playAABB(possibleColors) {
    let colorAABB = possibleColors.slice(0);
    let A = colorAABB[Math.floor(Math.random() * colorAABB.length)];
    let out = colorAABB.splice(A, 1);
    let B = 0;
    do {
        B = colorAABB[Math.floor(Math.random() * colorAABB.length)];
    }
    while (A === B)
    let aaBB = [A,A,B,B];
    if (checkIfGuessWasUsed(aaBB)) {
        return playAABB(aaBB);
    }
    return aaBB;
}

function testIfAABBWith(colorA, guess) {
    //Takes colorA and code and checks if the color was played in a AABB combination
    // If yes -> return colorB
    // If no -> return -1

    for (let i = 0; i < 2; i++) {
        let indexOfA = guess.indexOf(colorA)
        if (indexOfA !== -1) {
            guess.splice(indexOfA, 1);
        }
    }
    if (guess[0] === guess[1]) {
        return guess[0];
    } else {
        return -1;
    }
}

function testIfSingleWith(guess) {
    const result = guess.every(element => {
        if (element === guess[0]) {
            return true;
        }
    });
    return result;
}

function checkIfGuessWasUsed(guess) {
    console.log(`guess @checkIfGuessWasUsed => `, guess);
    if (guess.length !== 0 && memory['dumpCombinations'][0].length !== 0) {
        for (let dumpCombination of memory['dumpCombinations'][0]) {
            console.log(`dumpCombinations, guess => `, dumpCombination, guess);
            if (JSON.stringify(dumpCombination) === JSON.stringify(guess)) {
                return true;
            }
        }
    } else {
        return false;
    }
}

function setOfValidColors() {
    let setOfColors = [];
    for (let key in pegs) {
        //console.log(key);
        //console.log("memory", JSON.stringify(memory, null, 2));
        if (memory[key]['notInSecret'] === false) {
            setOfColors.push(parseInt(key));
        }
    }
    return setOfColors;
}

function countBandW(hints) {
    let b = 0;
    let w = 0;
    //console.log(`This are the hints: ${hints}`)
    for (let i = 0; i < hints.length; i++) {
        if (hints[i] != null) {
            //console.log(`this is a hint for row: ${hints[i]}`)
            if (hints[i] === 'hit') {
                b++;
            }
            if (hints[i] == 'almost') {
                w++;
            }
        }
        // console.log(`countBandW[${i}]: b${b}, w${w}`)
    }
    return {b, w};
}

export async function resetArtihuman() {
    numberArtiMoves = 0;
    numberGameMoves = 0;
    memory = await buildMemory(pegs);
    solutionSpace = await printAllKLength([1, 2, 3, 4, 5, 6], 4);
    solutionSet = await new Set(solutionSpace);
    //console.log(`I print memory => ${JSON.stringify(memory, null, 2)} \n
    //                solutionSpace => ${JSON.stringify(solutionSpace, null, 2)} \n
    //                solutionSet => ${JSON.stringify(solutionSet, null, 2)}`);
//
}

export function getArtihumanGuess() {
    numberArtiMoves++;
    return nextGuess_v2();
    // return [1,1,2,2];
}

export async function setArtihumanSlots(guess) {
    console.log("guess in setSlots: ", guess);
    console.log(artiHumanOptions);
    let slots = await getCurrentSlots();
    for (let i = 0; i < guess.length; i++) {
        slots[i].className = `socket peg ${pegs[guess[i]]}`;
    }
    //return slots;
}
export function getNumberGameMoves() {
    return numberGameMoves;
}

