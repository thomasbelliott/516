Hello, and welcome to my corpus analysis program!

This program is designed to extract noun + noun sequences from text files tagged using the CLAWS part-of-speech tagger (Constituent Likelihood Automatic Word-tagging System, http://ucrel.lancs.ac.uk/claws/). 

In the same folder as  finalProj.js you must have a subfolder called corpus_files, where you should place the files to be analyzed.  It should also contain a folder called 'cleaned' where some of the output files will be saved.

After placing the tagged text files in the corpus_files folder, open finalProj.js from your command line interface.  This will require first installing the node.js JavaScript runtime (https://nodejs.org/en/).

After running the program a cleaned (words only) version of each file will be written to the 'cleaned' folder.  Two CSV files will be written to the 'Final' folder, one compiling the Noun+Noun sequences found from all texts sorted by frequency, and another with the results separated by file name.  In the folder called 'KWIC_lines' a CSV file will be produced for each corpus file, showing Noun+Noun sequences highlighted in all caps inside the sentences in which they originally appeared.

A .txt file called 'analysis.txt.' will be produced as well.  This will contain analysis of each file's word count and noun+noun frequency information, as well as a summary across all files analyzed.  It will also compile individual files' results into disciplinary groupings (Biology, Philosophy, etc.) and Becher-Biglan groupings (Hard-Pure, Soft-Pure, etc.).

Note: The function assigning discipline name and Becher-Biglan grouping relies on the file naming convention used by the Michigan Corpus of Upper-Level Student Papers (MICUSP), which begins each file name with the first three letters of its discipline (e.g. BIOxxxxxx.txt). 


Tom Elliott
thomase@iastate.edu
