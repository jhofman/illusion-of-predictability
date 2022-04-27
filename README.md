# The illusion of predictability in common scientific visualizations

## Analysis 
This repository contains the data analysis code that accompanies the manuscript "The illusion of predictability in common scientific visualizations". All Mechanical Turk worker IDs have been anonymized.

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
