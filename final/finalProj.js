var fs = require('fs');
var path = require('path');

let disciplineNames = {
  BIO: "Biology ",
  CEE: "Civil & Environmental Engineering",
  CLS: "Classical Studies",
  ECO: "Economics ",
  EDU: "Education ",
  ENG: "English ",
  HIS: "History & Classical Studies",
  IOE: "Industrial & Operations Engineering",
  LIN: "Linguistics ",
  MEC: "Mechanical Engineering",
  NRE: "Natural Resources & Environment",
  NUR: "Nursing ",
  PHI: "Philosophy ",
  PHY: "Physics ",
  POL: "Political Science",
  PSY: "Psychology ",
  SOC: "Sociology "
};
    
let becherGroups = {
  soft_pure: ["ENG", "HIS", "CLS", "LIN", "PHI", "SOC"],
  soft_applied: ["ECO", "EDU", "POL", "PSY"],
  hard_pure:["BIO", "NRE", "PHY"],
  hard_applied: ["CEE", "IOE", "MEC", "NUR"]
};
let groupNames = Object.keys(becherGroups);

//LOCATE FILES, CREATE FILE NAMES ARRAY
let corpusFilesFolder = 'corpus_files';
let fileNames = fs.readdirSync(corpusFilesFolder);

//REMOVE HIDDEN FILES LIKE .DS_STORE
for (file of fileNames){
  if (file.substring(0,1) == "\."){
    fileNames.splice(fileNames.indexOf(file), 1);
  }
}

let filesCount = 0;
let allFilesInfo = {};
let summary = {};
let totalWordCount = 0;
let totalNounNouns = 0;
let eachNNsList = "";
let allNNsArray = [];

for (i=0; i < fileNames.length; i++){
  filesCount += 1;
  let fileInfo = {};
  fileInfo["File name"] = fileNames[i];

//WHICH DISCIPLINE?
  let disciplineCode = fileNames[i].substring(0,3);   
  for (disc in disciplineNames){
    if (disciplineCode == disc){
      fileInfo["Discipline "] = disciplineNames[disc];
    }
  }

//ASSIGN BECHER-BIGLAN DISCIPLINARY GROUP
  for(group of groupNames){
    for (discipline of becherGroups[group]){
      if (fileNames[i].search(discipline) != -1){
        fileInfo["Becher-Biglan group"] = group;
      }
    }
  }

//GRAB TEXT FROM FILE
  let text = fs.readFileSync(path.join(__dirname, corpusFilesFolder, fileNames[i]), 'utf8');
    
////CLEANING STEPS////    
    
//REMOVE WORKS CITED, APPENDIX
  let noBib = text.replace(/[\n\r](References*|Bibliography|Literature|Works*|Cit)(_[a-z0-9]+)*[\w\W]+/g, "").replace(/Appendix [\w\W]+/g, "");

//REMOVE PARENTHETICAL CITATIONS
  let noCites = noBib.replace(/\(\(\s*[A-Za-z0-9\s,:;.&@]+\)\)+/gi, "");
    
//REMOVE TAGS
  let noTags = noCites.replace(/_[a-z0-9]+/gi, "");
    
//REMOVE ALL PUNCTUATION, NUMBERS & EXTRA SPACES
  let justWords = noTags.replace(/[.,:;'!?_]+/g, "").replace(/["()@0-9]*/g, "").replace(/\s{2,}/g, " ").replace(/&\w+/g, "");
    
//FIND WORD COUNT    
  let wordCount = justWords.match(/\S+/g)
  fileInfo["Word Count"] = wordCount.length;
  totalWordCount += wordCount.length;
    
//OUTPUT CLEANED FILE to 'CLEANED' folder
  let cleanFile = "clean_" + fileNames[i];
  fs.writeFileSync(path.join(__dirname, 'cleaned', cleanFile), justWords);


////FINDING N+N SEQUENCES////  
    
//MAKE KWIC LINES//
  let highlightable = noCites.replace(/([\W])_[\W]/gi, "$1").replace(/[\n\r@]/g, "");
  
  let upperCase = highlightable.replace(/(\w+_N[N|P][\d\w]*\d*\s){2,}/gi, function(x){return x.toUpperCase()})
  
  toHighlight = upperCase.replace(/_[A-Z0-9]+/g, "").replace(/,/g,"");    
  let kwics = toHighlight.match(/(^|[.?!;])\s*([a-zA-Z\d\s',"\-\(\)\*]*([A-Z]{2,}(\s|[.;?!])*){2,}[a-zA-Z\d\s',"\-\(\)\*]*)/g);
  
  let kwicString = "";  
  for(x=0; x<kwics.length; x++){
      kwicString += kwics[x] + "\n";
  }

  let kwicFile = fileNames[i] + "_KWIC_lines.csv";
  fs.writeFileSync(path.join(__dirname, 'KWIC_lines', kwicFile), kwicString);

//COUNT NOUN NOUN SEQUENCES
  let nounNouns = noCites.match(/(\w+_N[N|P][\d\w]*\d*\s){2,}/gi);
  fileInfo["No. of N+N sequences RAW"] = nounNouns.length;
  totalNounNouns += nounNouns.length;   
  fileInfo["No. of N+N sequences NORMALIZED per 1000 words"]  = ((nounNouns.length/wordCount.length)*1000).toFixed(2);
     
//REMOVE TAGS FROM NOUN NOUNS
  let cleanNounNouns = []
  for (nn of nounNouns){
      let clean = nn.replace(/_N[N|P][\d\w]*\d*/gi, "");
      cleanNounNouns.push(clean);
  }
    
  allFilesInfo[fileNames[i]] = fileInfo;    
    

//PUT NNS IN OBEJCT WITH FREQUENCIES, ORDER BY FREQUENCY, MAKE CSV
    let nnFrequencies = {};
    for (bundle of cleanNounNouns){
        if (nnFrequencies[bundle] >= 1){
            nnFrequencies[bundle]++;
        }else
            nnFrequencies[bundle] = 1;
    }
    let sortable = [];
    for(bundle in nnFrequencies){
        sortable.push([bundle, nnFrequencies[bundle]]);
        allNNsArray.push([bundle, nnFrequencies[bundle]]);
    }
    sortable.sort(function(a,b){
        return b[1]-a[1];
    });

    sortableExcel = sortable.toString().replace(/(\d\,)/g, "$1\n");

//WRITE TO CSV    
    eachNNsList += fileNames[i] + "\n" + sortableExcel + "\n";
    fs.writeFileSync("eachNNs.csv", eachNNsList);
    
}  //END OF LOOP THRU FILES//

//OUTPUT CSV OF ALL NNS SORTED BY FREQUENCY
allNNsArray.sort(function(c,d,){
  return d[1]-c[1];
});
allNNsExcel = allNNsArray.toString().replace(/(\d\,)/g, "$1\n");
fs.writeFileSync("allNNs.csv", allNNsExcel);


//INFO FOR ALL FILES COMBINED - "SUMMARY"
summary["Total files"] = filesCount;
summary["Total word count"] = totalWordCount;
let normNum = Math.pow(10, ((totalWordCount.toString().length)-1));
summary["Total noun-noun sequences"] = totalNounNouns;
summary["Noun-noun sequences per 1000 words"] = ((totalNounNouns/totalWordCount)*1000).toFixed(2);
summary["Most frequent N+N sequence"] = allNNsArray[0];

//INFO FOR EACH DISCIPLINE'S FILES COMBINED
let eachDisc = {};
for (file in allFilesInfo){  
    disc = (allFilesInfo[file]["Discipline "]);
    if (eachDisc[disc] == undefined) {
      eachDisc[disc] = {};
      eachDisc[disc]["Becher-Biglan group"] = allFilesInfo[file]["Becher-Biglan group"];
      eachDisc[disc]["Number of files"] = 0;
      eachDisc[disc]["Total Word Count"] = 0;
      eachDisc[disc]["No. of N+N sequences RAW"] = 0;
    }
    eachDisc[disc]["Number of files"]++;
    fileWordCount = allFilesInfo[file]["Word Count"];
    eachDisc[disc]["Total Word Count"]+= fileWordCount;
    fileNN = (allFilesInfo[file]["No. of N+N sequences RAW"]);
    eachDisc[disc]["No. of N+N sequences RAW"] += fileNN;
    eachDisc[disc]["no. of N+N sequences NORM"] = ((eachDisc[disc]["No. of N+N sequences RAW"]/eachDisc[disc]["Total Word Count"])*1000).toFixed(2);
}
//for (thing in eachDisc){
//    raw = (eachDisc[thing]["No. of N+N sequences RAW"]);
//    total = eachDisc[thing]["Total Word Count"];
//    eachDisc[thing]["No. of N+N sequences NORM per 1000 words"] = ((raw/total)*1000).toFixed(2);
//}

//INFO FOR EACH BECHER GROUP
let eachGroup = {};
for (file in allFilesInfo){  
    becher = (allFilesInfo[file]["Becher-Biglan group"]);
    if (eachGroup[becher] == undefined) {
      eachGroup[becher] = {};
      eachGroup[becher]["Number of files"] = 0;
      eachGroup[becher]["Total Word Count"] = 0;
      eachGroup[becher]["No. of N+N sequences RAW"] = 0;
      eachGroup[becher]["No. of N+N sequences NORM"] = 0;
    }
    eachGroup[becher]["Number of files"]++;
    fileWordCount = allFilesInfo[file]["Word Count"];
    eachGroup[becher]["Total Word Count"]+= fileWordCount;
    eachGroup[becher]["Normed "] = `per 1000 words`;
    eachGroup[becher]["No. of N+N sequences RAW"] += (allFilesInfo[file]["No. of N+N sequences RAW"]);
    eachGroup[becher]["No. of N+N sequences NORM"] = ((eachGroup[becher]["No. of N+N sequences RAW"]/eachGroup[becher]["Total Word Count"])*1000).toFixed(2);   
}

////DATA FOR OUTPUT TO TEXT FILE

summary = JSON.stringify(summary).replace(/,/g, "\n").replace(/"/g, "").replace(/(})/g, "}\n");

eachGroup = JSON.stringify(eachGroup).replace(/,/g, "\n").replace(/"/g, "").replace(/(})/g, "}\n").replace(/:{/g, ":\n{");

eachDisc = JSON.stringify(eachDisc).replace(/,/g, "\n").replace(/"/g, "").replace(/(})/g, "}\n").replace(/:{/g, ":\n{");

allFilesInfo = JSON.stringify(allFilesInfo).replace(/,/g, "\n").replace(/"/g, "").replace(/(})/g, "}\n").replace(/:{/g, ":\n{");

let outputFile = "\tSUMMARY\n\n" + summary + "\n\tINFO BY BECHER-BIGLAN GROUPING\n\n" + eachGroup + "\n\tINFO BY DISCIPLINE\n\n" + eachDisc + "\n\tINFO FOR ALL FILES INDIVIDUALLY\n\n" + allFilesInfo;

fs.writeFileSync("analysis.txt", outputFile, 'utf-8');

/* TO DO

add range values to show how many papers each NN appears in

in Becher-Biglan grouping info, add how many papers included from each sub-discipline

*/