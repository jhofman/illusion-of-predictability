# An illusion of predictability in scientific results

## Analysis 
This repository contains the data analysis code that accompanies the manuscript "An illusion of predictability in scientific results". All Mechanical Turk worker IDs have been anonymized.

Steps for running the analysis code:
1. Initialize a Python environment and install the dependencies in `requirements.txt` or `requirements-osx.txt`.
2. Ensure that the current R environment has the correct dependencies installed.
3. Run `make`

## Web experiments

The web experiments are available in the `experiment-frontends` directory.

* The medical providers experiment is a static website in the `medical` subdirectory. A live version is [available here](https://jhofman.github.io/medical-effects).
* The faculty and data scientist experiments are webpack-compiled web apps and instructions for developing, testing, and deploying those applications can be found in their respective subdirectories. Links to live versions of the [data science experiment](https://jhofman.github.io/scientific-incentives/psup/psup.html) and of the [faculty experiment](https://jhofman.github.io/scientific-incentives/faculty/psup.html).

## Experimental stimuli
Scripts to generate the experimental stimuli are saved in the `stimuli-scripts` directory.

## Data from the paper

The data to entirely reproduce the results paper is available in this repository. The anonymized raw data in "long" format is available in the `raw-data` directory. For convenience for the user, tidy data for data scientists and faculty is available in the `tidy-data` directory. For instance, for the data scientists:

- `tidy-data/datascientists-tidy-background.csv` contains the responses to the background questions
- `tidy-data/datascientists-tidy-elapsed.csv` contains timing data on the responses
- `tidy-data/datascientists-tidy-psup-game.csv` contains the results for the repeated probability of superiority estimation task
- `tidy-data/datascientists-tidy-editorial.csv` contains the results for the editorial judgment task
- `tidy-data/datascientists-tidy-feedback.tsv` contains the raw feedback from each respondent
