const express = require('express');
const { CronJob } = require('cron');
const fs = require('fs'); // Require the fs module
const path = require('path'); // Require the path module
const moment = require('moment'); // Importera moment

// Initialize the Express app
const app = express();
const port = 3000;


const jsonFilePath = path.join(__dirname, 'json', 'm.json');
const jsonFilePath2 = path.join(__dirname, 'json', 'm2.json');
const jsonFilePathEmpty = path.join(__dirname, 'json', 'emptyMatch.json');

// Funktion för att nollställa data i JSON-filen
function resetJsonData() {
  // Läs den aktuella datan från JSON-filen
  fs.readFile(jsonFilePathEmpty, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file for reset:', err);
      return;
    }

    let currentData;
    try {
      // Försök att parsa JSON-data
      currentData = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing JSON data for reset:', parseErr);
      return;
    }
    //nollställ loggen
    fs.writeFile('log.txt', `Cron job executed at ${new Date().toLocaleTimeString()}\n`, (err) => {
      if (err) throw err;
      console.log('Log updated!');
    });

    // Säkerhetskopiera den aktuella datan om det behövs
    fs.writeFile( path.join(__dirname, 'json', 'backup_m.json'), JSON.stringify(currentData, null, 2), (backupErr) => {
      if (backupErr) {
        console.error('Error creating backup of JSON data:', backupErr);
        return;
      }
      console.log('Backup of JSON data created successfully.');
      console.log(currentData.GameEvents.Game.CurrentGameClock)
      console.log('SKRIVER ÖVER HÄR')
      
      // Skriv den nya datan till filen
      fs.writeFile(jsonFilePath, JSON.stringify(currentData, null, 2), (resetErr) => {
        if (resetErr) {
          console.error('Error resetting JSON data:', resetErr);
        } else {
          console.log('JSON data has been reset to initial state.');
        }
      });
      fs.writeFile(jsonFilePath2, JSON.stringify(currentData, null, 2), (resetErr) => {
        if (resetErr) {
          console.error('Error resetting JSON data:', resetErr);
        } else {
          console.log('JSON data has been reset to initial state.');
        }
      });
    });
  });
}

// Anropa reset-funktionen när skriptet startar
resetJsonData();


// Function to read JSON file
const readJsonFile = (callback) => {
  const filePath = path.join(__dirname, 'json', 'm.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      callback(err, null);
      return;
    }
    try {
      const GamePlayers = JSON.parse(data).GameEvents.Game.PlayerStatistics.PlayerStatistic;
      const Players = JSON.parse(data).GameEvents.Codes.Players.Player;
      const Teams = JSON.parse(data).GameEvents.Codes.Teams.Team;

      GamePlayers.forEach((a)=>{
        a.playerObject = Players.filter((b)=> b.Id === a.PlayerId)[0]
        a.playerTeam = Teams.filter((b)=> b.Id === a.playerObject.TeamId)[0]
        a.Position = a.playerObject.Position
      })
      callback(null, JSON.parse(data));
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      callback(parseErr, null);
    }
  });
};

const readJsonFile2_match = (callback) => {
  const filePath = path.join(__dirname, 'json', 'm2.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      callback(err, null);
      return;
    }
    try {
      const GamePlayers = JSON.parse(data).GameEvents.Game.PlayerStatistics.PlayerStatistic;
      const Players = JSON.parse(data).GameEvents.Codes.Players.Player;
      const Teams = JSON.parse(data).GameEvents.Codes.Teams.Team;

      GamePlayers.forEach((a)=>{
        a.playerObject = Players.filter((b)=> b.Id === a.PlayerId)[0]
        a.playerTeam = Teams.filter((b)=> b.Id === a.playerObject.TeamId)[0]
        a.Position = a.playerObject.Position
      })
      callback(null, JSON.parse(data));
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      callback(parseErr, null);
    }
  });
};

// Function to read a file and return a promise
const readJsonFile2 = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        reject(err);
      } else {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (parseErr) {
          console.error('Error parsing JSON:', parseErr);
          reject(parseErr);
        }
      }
    });
  });
};
// Set up a route
app.get('/', (req, res) => {
  readJsonFile((err, jsonData) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read JSON file' });
    } else {
    
      res.json(jsonData); // Send JSON data as the response
    }
  });
});

app.get('/round', async (req, res) => {
  try {
    const filePath1 = path.join(__dirname, 'json', 'm.json');
    const filePath2 = path.join(__dirname, 'json', 'm2.json');

    // Read both files asynchronously
    const [jsonData1, jsonData2] = await Promise.all([
      readJsonFile2(filePath1),
      readJsonFile2(filePath2)
    ]);

    // Combine or use the data from both files as needed
    var serialName = 'Hockeyettan demo 2024';
    var newObject = {};
    var newarray = [];
    const Teams = jsonData1.GameEvents.Codes.Teams.Team;
    var index = 0;

    newObject["G1Result.Text"] = jsonData1.GameEvents.Game.GoalsHome +' - ' + jsonData1.GameEvents.Game.GoalsGuest;

    newObject["Headline.Text"] = 'DAGENS MATCHER HOCKEYETTAN 2024';
    newObject["G1HomeName.Text"] = Teams[0].ClubPreferredName || Teams[0].Name;
    newObject["G1AwayName.Text"] = Teams[1].ClubPreferredName || Teams[1].Name;

    newObject["G1HomeLogo.Source"] ='https://vmix.hockeyettan.se/scoreImages/' + Teams[0].Shortname + '.png';
    newObject["G1AwayLogo.Source"] = 'https://vmix.hockeyettan.se/scoreImages/' + Teams[1].Shortname + '.png';
    newObject["G1Background.Source"] = 'https://vmix.hockeyettan.se/scoreImages/skylt.png';


    newObject["G2Result.Text"] = jsonData2.GameEvents.Game.GoalsHome +' - ' + jsonData2.GameEvents.Game.GoalsGuest;
    newObject["G2HomeName.Text"] = 'Hudiksvalls HC';
    newObject["G2AwayName.Text"] = 'Kiruna IF';
    newObject["G2HomeLogo.Source"] ='https://vmix.hockeyettan.se/scoreImages/HUD.png';
    newObject["G2AwayLogo.Source"] = 'https://vmix.hockeyettan.se/scoreImages/KIR.png';
    newObject["G2Background.Source"] = 'https://vmix.hockeyettan.se/scoreImages/skylt.png';



    if (2 < 6) {
      for (let index = 2; index <= 6; index++) {
        newObject["G" + (index + 1) + "Result.Text"] = '';
        newObject["G" + (index + 1) + "HomeName.Text"] = '';
        newObject["G" + (index + 1) + "AwayName.Text"] = '';
        newObject["G" + (index + 1) + "HomeLogo.Source"] = '';
        newObject["G" + (index + 1) + "AwayLogo.Source"] = '';
        newObject["G" + (index + 1) + "Background.Source"] =
          'https://vmix.hockeyettan.se/scoreImages/=TOM LOGO.png';
      }
    }
    newarray.push(newObject);

    // Send combined data as JSON response
    res.json(newarray);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read JSON files' });
  }
});

// Skapa cronjobbet
const AddGoal = new CronJob(
    '*/30 * * * * *', // Var tredje sekund (justera efter behov)
    () => {
      console.log('Cron job executed at', new Date().toLocaleTimeString());
  
      // Exempel på att skriva till en fil med hjälp av fs
      fs.appendFile('log.txt', `Cron job executed at ${new Date().toLocaleTimeString()}\n`, (err) => {
        if (err) throw err;
        console.log('Log updated!');
      });
  
      // Läs JSON-filen
      readJsonFile((err, jsonData) => {
        if (err) {
          console.error('Error reading JSON in cron job:', err);
        } else {
          let GamePlayers = jsonData.GameEvents.Game.PlayerStatistics.PlayerStatistic;
          const Players = jsonData.GameEvents.Codes.Players.Player;
          const Teams = jsonData.GameEvents.Codes.Teams.Team;
    
          GamePlayers.forEach((a)=>{
            a.playerObject = Players.filter((b)=> b.Id === a.PlayerId)[0]
            a.playerTeam = Teams.filter((b)=> b.Id === a.playerObject.TeamId)[0]
            a.TeamId  = a.playerTeam.Id
          })

          const PlayersHome = GamePlayers.filter((a)=> a.TeamId === '104911');
          const PlayersAway = GamePlayers.filter((a)=> a.TeamId === '104913');
          
          let randomNumber = Math.floor(Math.random() * 2) + 1;
          if(randomNumber === 1){
            GamePlayers = PlayersHome
          }else{
            GamePlayers = PlayersAway

          }

          //check periods 
          let periodNr;
          console.log(jsonData.GameEvents.Game.Periods.Period.length)
          if(jsonData.GameEvents.Game.Periods.Period.length === 1){
            periodNr = 1
          } else if(jsonData.GameEvents.Game.Periods.Period.length === 2){
            periodNr = 2
          }else{
            periodNr = jsonData.GameEvents.Game.Periods.Period.length
          }
          //Add Goal and assist to players
          const RandomGoalScoreIndex = Math.floor(Math.random() * GamePlayers.filter((p) => p.Position !== 'GK').length);
          const RandomGoalAssistIndex = Math.floor(Math.random() * GamePlayers.filter((p) => p.Position !== 'GK' && p.TeamId === GamePlayers[RandomGoalScoreIndex].TeamId).length);



          GamePlayers[RandomGoalScoreIndex].SkaterGame.G = (parseInt(GamePlayers[RandomGoalScoreIndex].SkaterGame.G) + 1).toString()
          GamePlayers[RandomGoalAssistIndex].SkaterGame.A = (parseInt(GamePlayers[RandomGoalScoreIndex].SkaterGame.A) + 1).toString()
          //Add goal to players team
          console.log('Goals Home: '+jsonData.GameEvents.Game.GoalsHome)
        if(randomNumber === 1){
            jsonData.GameEvents.Game.GoalsHome = (parseInt(jsonData.GameEvents.Game.GoalsHome) + 1).toString()
            jsonData.GameEvents.Game.Periods.Period[periodNr-1].Goals.Home = (parseInt(jsonData.GameEvents.Game.Periods.Period[periodNr-1].Goals.Home)+1).toString()
            jsonData.GameEvents.Game.Periods.Period[periodNr-1].Shots.Home = (parseInt(jsonData.GameEvents.Game.Periods.Period[periodNr-1].Shots.Home)+1).toString()
            jsonData.GameEvents.Game.ShotsHome = (parseInt(jsonData.GameEvents.Game.ShotsHome)+1).toString()
        }else{
            jsonData.GameEvents.Game.GoalsGuest = (parseInt(jsonData.GameEvents.Game.GoalsGuest) + 1).toString()
            jsonData.GameEvents.Game.Periods.Period[periodNr-1].Goals.Guest = (parseInt(jsonData.GameEvents.Game.Periods.Period[periodNr-1].Goals.Guest)+1).toString()
            jsonData.GameEvents.Game.Periods.Period[periodNr-1].Shots.Guest = (parseInt(jsonData.GameEvents.Game.Periods.Period[periodNr-1].Shots.Guest)+1).toString()
            jsonData.GameEvents.Game.ShotsGuest = (parseInt(jsonData.GameEvents.Game.ShotsGuest)+1).toString()
        }

        let randomNumberSave = Math.floor(Math.random() * 6) + 1;
        let randomNumberPenalty = Math.floor(Math.random() * 7) + 1;
        let randomNumberPpwePlay = Math.floor(Math.random() * 5) + 1;
        //add save and shot to Home
        if(randomNumberSave === 3){
            jsonData.GameEvents.Game.Periods.Period[periodNr-1].Saves.Home = (parseInt(jsonData.GameEvents.Game.Periods.Period[periodNr-1].Saves.Home)+1).toString()
            jsonData.GameEvents.Game.Periods.Period[periodNr-1].Shots.Home = (parseInt(jsonData.GameEvents.Game.Periods.Period[periodNr-1].Shots.Home)+1).toString()
            jsonData.GameEvents.Game.ShotsHome = (parseInt(jsonData.GameEvents.Game.ShotsHome)+1).toString()
            jsonData.GameEvents.Game.SavesHome = (parseInt(jsonData.GameEvents.Game.SavesHome)+1).toString()

            
        }
        //add save and shot to Guest
        if(randomNumberSave === 5){
            jsonData.GameEvents.Game.Periods.Period[periodNr-1].Saves.Guest = (parseInt(jsonData.GameEvents.Game.Periods.Period[periodNr-1].Saves.Guest)+1).toString()
            jsonData.GameEvents.Game.Periods.Period[periodNr-1].Shots.Guest = (parseInt(jsonData.GameEvents.Game.Periods.Period[periodNr-1].Shots.Guest)+1).toString()
            jsonData.GameEvents.Game.ShotsGuest = (parseInt(jsonData.GameEvents.Game.ShotsGuest)+1).toString()
            jsonData.GameEvents.Game.SavesGuest = (parseInt(jsonData.GameEvents.Game.SavesGuest)+1).toString()

        }

        //add penalty
        if(randomNumberPenalty === 1 || randomNumberPenalty === 2 || randomNumberPenalty === 3){
          const RandomGoalPenaltyIndex = Math.floor(Math.random() * GamePlayers.filter((p) => p.Position !== 'GK').length);
          GamePlayers[RandomGoalPenaltyIndex].SkaterGame.PIM = (parseInt(GamePlayers[RandomGoalScoreIndex].SkaterGame.PIM) + 2).toString()
          if(randomNumber === 1){
            jsonData.GameEvents.Game.PimHome = (parseInt(jsonData.GameEvents.Game.PimHome) + 2).toString()
          }else{
            jsonData.GameEvents.Game.PimGuest = (parseInt(jsonData.GameEvents.Game.PimGuest) + 2).toString()
          }
        }

        //add Powerplay
        if(randomNumberPpwePlay === 1 || randomNumberPpwePlay === 2){
          const RandomGoalPenaltyIndex = Math.floor(Math.random() * GamePlayers.filter((p) => p.Position !== 'GK').length);
          GamePlayers[RandomGoalPenaltyIndex].SkaterGame.PPG = (parseInt(GamePlayers[RandomGoalScoreIndex].SkaterGame.PPG) + 5).toString()
          if(randomNumber === 1){
            jsonData.GameEvents.Game.PPPrcHome = (parseInt(jsonData.GameEvents.Game.PPPrcHome) + 5).toString()
          }else{
            jsonData.GameEvents.Game.PPPrcGuest = (parseInt(jsonData.GameEvents.Game.PPPrcGuest) + 5).toString()
          }
        }

        console.log('==='+jsonData.GameEvents.Game.CurrentGameClock+'===')
        //push period 2
        if(jsonData.GameEvents.Game.CurrentGameClock === '20:00'){
            jsonData.GameEvents.Game.Periods.Period.push({
                "Id": "2",
                "Name": "2",
                "PeriodType": "R",
                "Starttime": "16:20",
                "Endtime": "16:40",
                "Status": "3",
                "Length": "1200",
                "Goals": {
                  "Home": "0",
                  "Guest": "0"
                },
                "Shots": {
                  "Home": "0",
                  "Guest": "0"
                },
                "Saves": {
                  "Home": "0",
                  "Guest": "0"
                },
                "PIM": {
                  "Home": "0",
                  "Guest": "0"
                },
                "FaceOff": {
                  "Home": "-",
                  "Guest": "-"
                },
                "Possession": {
                  "Home": "",
                  "PrcIntHome": "",
                  "Guest": "",
                  "PrcIntGuest": ""
                },
                "PossessionOff": {
                  "Home": "",
                  "Guest": ""
                }
              })
        }

        //push period 3
        if(jsonData.GameEvents.Game.CurrentGameClock === '40:00'){
            console.log('period 3 pushad')
            jsonData.GameEvents.Game.Periods.Period.push({
                "Id": "3",
                "Name": "3",
                "PeriodType": "R",
                "Starttime": "16:40",
                "Endtime": "17:00",
                "Status": "3",
                "Length": "1200",
                "Goals": {
                "Home": "0",
                "Guest": "0"
                },
                "Shots": {
                "Home": "0",
                "Guest": "0"
                },
                "Saves": {
                "Home": "0",
                "Guest": "0"
                },
                "PIM": {
                "Home": "0",
                "Guest": "0"
                },
                "FaceOff": {
                "Home": "-",
                "Guest": "-"
                },
                "Possession": {
                "Home": "",
                "PrcIntHome": "",
                "Guest": "",
                "PrcIntGuest": ""
                },
                "PossessionOff": {
                "Home": "",
                "Guest": ""
                }
            })
        }
        //matchen restartar gått en timme 
        if(jsonData.GameEvents.Game.CurrentGameClock === '59:00' || periodNr > 3){
          console.log('STÄNGDE HÄR BÖRJAR DET')
            AddGoal.stop();
            resetJsonData();
            AddGoal.start();
        }
        jsonData.GameEvents.Game.CurrentGameClock = moment(jsonData.GameEvents.Game.CurrentGameClock, "mm:ss");
        jsonData.GameEvents.Game.CurrentGameClock = jsonData.GameEvents.Game.CurrentGameClock.add(1, 'minutes').format('mm:ss');


          fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), (resetErr) => {
            if (resetErr) {
              console.error('Error resetting JSON data:', resetErr);
            } else {
              console.log('1 Goal added for ' + GamePlayers[RandomGoalScoreIndex].playerObject.Firstname);
            }
          });
        }
      });
    },
    null,
    false, // Börja inte jobba direkt
    'Europe/Stockholm' // Tidszon för jobbet
  );
  
  // Starta cronjobbet
  AddGoal.start();
  


  const AddGoal2 = new CronJob(
    '*/20 * * * * *', // Var tredje sekund (justera efter behov)
    () => {
      console.log('Cron job executed at', new Date().toLocaleTimeString());
  
  
      // Läs JSON-filen
      readJsonFile2_match((err, jsonData) => {
        if (err) {
          console.error('Error reading JSON in cron job:', err);
        } else {
          let GamePlayers = jsonData.GameEvents.Game.PlayerStatistics.PlayerStatistic;
          const Players = jsonData.GameEvents.Codes.Players.Player;
          const Teams = jsonData.GameEvents.Codes.Teams.Team;
          let randomNumber = Math.floor(Math.random() * 2) + 1;
          if(randomNumber === 1){
            jsonData.GameEvents.Game.GoalsHome = (parseInt(jsonData.GameEvents.Game.GoalsHome) + 1).toString()
            }else{
                jsonData.GameEvents.Game.GoalsGuest = (parseInt(jsonData.GameEvents.Game.GoalsGuest) + 1).toString()
            }
        
        //matchen restartar gått en timme 
        if(jsonData.GameEvents.Game.CurrentGameClock === '59:00'){
          console.log('STÄNGDE HÄR BÖRJAR DET')
            AddGoal2.stop();
            resetJsonData();
            AddGoal2.start();
        }
        jsonData.GameEvents.Game.CurrentGameClock = moment(jsonData.GameEvents.Game.CurrentGameClock, "mm:ss");
        jsonData.GameEvents.Game.CurrentGameClock = jsonData.GameEvents.Game.CurrentGameClock.add(1, 'minutes').format('mm:ss');


          fs.writeFile(jsonFilePath2, JSON.stringify(jsonData, null, 2), (resetErr) => {
            if (resetErr) {
              console.error('Error resetting JSON data:', resetErr);
            } else {
              console.log('1 Goal added for ');
            }
          });
        }
      });
    },
    null,
    false, // Börja inte jobba direkt
    'Europe/Stockholm' // Tidszon för jobbet
  );
  AddGoal2.start();

  // Ställ in en timer för att stoppa cronjobbet efter en viss tid
  setTimeout(() => {
    console.log('Stopping the cron job');
    AddGoal.stop(); // Stoppa cronjobbet
  }, 60 * 60 * 1000); // Stoppa efter 60 sekunder (1 minut)
  
  // Ställ in en timer för att starta om cronjobbet efter ytterligare en viss tid
  setTimeout(() => {
    console.log('Restarting the cron job');
    AddGoal.start(); // Starta om cronjobbet
  }, 61 * 60 * 1000); // Starta om efter 120 sekunder (2 minuter)
// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
