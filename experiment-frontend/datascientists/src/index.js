import { Chart } from '@antv/g2';
import { 
    createBars, samplePointsFromScenario, experimentStateToTrialSettings,
    EXPERIMENTS_ENUM, EXPERIMENTAL_CONDITIONS_ENUM, experimentToExperimentSettings,
    viewForExperimentStage, nextExperimentStage, EXPERIMENT_STAGES
} from "./experiment"
import { getShuffledScenario } from "./scenarios"
import { round100, generateScenarioWithPsupInRange, uuidv4, browserFingerprintGuid } from "./stats"
import { logToAzure, submitToMturk } from './web';
import { collectCheckedValuesByCheckboxName, getRadioButtonValue } from "./helpers"
import _ from "lodash"

const pageUrl = new URL(window.location.href)
const CURRENT_EXPERIMENT = (pageUrl.searchParams.get("CURRENT_EXPERIMENT") || EXPERIMENTS_ENUM.PAPER_REVIEW_PILOT2)
const EXPERIMENT_SETTINGS = experimentToExperimentSettings(CURRENT_EXPERIMENT)

let chart, experimentState={
    experiment: CURRENT_EXPERIMENT,
    stage: (pageUrl.searchParams.get("stage") || EXPERIMENT_SETTINGS.experimentStages[0])
}

let experimentResults=[], trialSettings, showPoints, showTutorial, scenarios=getShuffledScenario(), startTime = new Date().getTime(), usingMturk=true, mturkParams={}

const condition = (pageUrl.searchParams.get("condition") || _.sample(EXPERIMENT_SETTINGS.conditionsUsed))
const colors = ["#af8dc3", "#7fbf7b"]
const modals = document.querySelectorAll('.modal');
let modal = M.Modal.init(modals, {
    opacity: 0.9,
    dismissable: true,
})[0];

function resetGame(scenario, trialSettings) {
    chart.clear()

    document.querySelector("#theguess").value = ""
    document.querySelector("#answer").textContent = ""
    document.querySelector("#submitguess").style.display = "block"
    document.querySelector("#after_game").style.display = "none"
    document.querySelector("#tutorial").style.display = "none"
    document.querySelector("#treatment_num").textContent = scenario.n1
    document.querySelector("#control_num").textContent = scenario.n2

    let bars = createBars(scenario, trialSettings)
    let {lowerBound, upperBound} = bars

    chart.legend(false);
    chart.changeData(bars.data);

    chart.tooltip({
        showMarkers: false
    });

    chart.point()
        .position('name*value')
        .color('name', 'black')
        .size(5)
        .style({
            fillOpacity: 0,
        });

    chart.interval()
        .position('name*range')
        .color('name', 'black')
        .size(40)
        .shape('tick');

    chart.scale({
        value: {
            min: round100(lowerBound - 0.1 * Math.abs(lowerBound)),
            max: round100(upperBound + 0.1 * Math.abs(upperBound)),
            formatter(y) { return y.toFixed(1) },
        },
        range: {
            min: round100(lowerBound - 0.1 * Math.abs(lowerBound)),
            max: round100(upperBound + 0.1 * Math.abs(upperBound)),
            formatter(y) { return y.toFixed(1) },
        },
        name: {min: 0, max: 5, formatter(x) {
            if (x == 1) { return `Treatment (n=${scenario.n1})` }
            if (x == 4) { return `Control (n=${scenario.n2})` }

            return ""
        }, ticks: [1, 4]
    }
    })


    showPoints = () => {
        let points = samplePointsFromScenario(scenario)
        let {lowerBound, upperBound} = points

        let chartPointView = chart.createView({
            padding: 0
        })

        chartPointView.data(points.data)
        chartPointView.axis(false)
        chartPointView.tooltip(false)
        chartPointView
            .point()
            .position('name*value')
            //.adjust([{type: 'jitter'}])
            .color("xcenter", colors)
            .shape("circle")
            .size(3)
            .style({fillOpacity: 0.5, strokeOpacity: 0.5})
        chartPointView.scale({
            value: {
                min: round100(lowerBound - 0.1 * Math.abs(lowerBound)),
                max: round100(upperBound + 0.1 * Math.abs(upperBound)),
                formatter(y) { return y.toFixed(1) },
            },
            name: {min: 0, max: 5, ticks: [1, 4]}
        });

        chart.scale({
            value: {
                min: round100(lowerBound - 0.1 * Math.abs(lowerBound)),
                max: round100(upperBound + 0.1 * Math.abs(upperBound)),
                formatter(y) { return y.toFixed(1) },
            },
            range: {
                min: round100(lowerBound - 0.1 * Math.abs(lowerBound)),
                max: round100(upperBound + 0.1 * Math.abs(upperBound)),
                formatter(y) { return y.toFixed(1) },
            },
            name: {
                min: 0,
                max: 5,
                formatter(x) {
                    if (x == 1) { return `Treatment (n=${scenario.n1})` }
                    if (x == 4) { return `Control (n=${scenario.n2})` }

                    return ""
                },
                ticks: [1, 4]
            },
        })
    }

    showTutorial = () => {
        if (!trialSettings.showTutorial) {
            return
        }

        if (!trialSettings.usePoints) {
            showPoints()
            chart.render()
        }

        document.querySelector("#tutorial").style.display ="block"
    }

    if (trialSettings.usePoints) {
        showPoints()
    }

    chart.interaction('active-region');
    chart.render();
}

function submitGuess(event) {
    event.preventDefault()
    if (experimentState.guessed) {
        return
    }

    let guessElement = document.querySelector("#theguess")
    if (guessElement.value.length == 0) {
        // bail if empty guess
        return
    }

    let guess = parseInt(guessElement.value)
    if (guess < 50 || guess > 100) {
        return
    }

    experimentState.guessed = true
    experimentState['guess'] = guess
    recordExperimentState()
    showTutorial()

    document.querySelector("#answer").textContent = parseInt(Math.round(100 * experimentState.scenario.probOfSuperiority))
    document.querySelector("#answer_block").style.display = trialSettings.showFeedback ? "block" : "none"
    document.querySelector("#after_game").style.display = "block"
    document.querySelector("#submitguess").style.display = "none"
}

function recordExperimentState() {
    let currentTime = Date.now()
    experimentState['currentTime'] = currentTime
    experimentState['startTime'] = startTime

    let omitted = experimentState.stage == EXPERIMENT_STAGES.PSUP_GAME ? ['guessed'] : ['guessed', 'scenario', 'trial']

    let usefulExperimentData = Object.assign({}, _.omit(experimentState, omitted), mturkParams)
    logToAzure(usefulExperimentData).catch((logToAzureError) => {
        console.error({usefulExperimentData, logToAzureError})
    })

    experimentResults.push(usefulExperimentData)
    window.experimentResults = experimentResults
}

function newGame(trialSettings) {
    console.log({experimentState, trialSettings})
    document.querySelector("#trialdisplay").textContent = experimentState.trial
    experimentState.guessed = false

    if (trialSettings.obtainConfirmationPre) {
        modal = document.querySelector('#confirmation_modal_pre');
        const instance = M.Modal.getInstance(modal);
        instance.open()
    }
    else if (trialSettings.obtainConfirmationPost) {
        modal = document.querySelector('#confirmation_modal_post');
        const instance = M.Modal.getInstance(modal);
        instance.open()
    }

    let scenario
    if (EXPERIMENT_SETTINGS.yoke) {
        scenario = scenarios[experimentState.trial - 1]
    }
    else {
        scenario = generateScenarioWithPsupInRange(.5, .75)
    }

    console.log({scenarios, scenario, trialnum: experimentState.trial})
    resetGame(scenario, trialSettings)
    experimentState.scenario = scenario
    document.querySelector("#theguess").focus()
}

function updateExperiment(trial, condition) {
    if (EXPERIMENTAL_CONDITIONS_ENUM[condition] === undefined) {
        console.error("Condition must be one of SE_ONLY, SE_POINTS, SE_POINTS_ONESHOT, or SE_POINTS_FEEDBACK.")
    }

    // when switching to mturk mode, these should be assigned differently.
    // trial = 1 always at the start
    // condition is assigned randomly or by mturk
    experimentState.trial = trial
    experimentState.condition = condition

    trialSettings = experimentStateToTrialSettings(experimentState)

    experimentResults = []
    newGame(trialSettings)
}

window.updateExperiment = updateExperiment

function endOfPsupGame() {
    let nextStage = nextExperimentStage(experimentState.stage, EXPERIMENT_SETTINGS.experimentStages)

    if (nextStage === undefined) {
        submitToMturk(mturkParams, experimentResults)
    }
    else {
        experimentState.stage = nextStage
        updateViewForExperimentStage(nextStage)
    }
}

function nextRound() {
    if (experimentState.trial == EXPERIMENT_SETTINGS.totalTrials) {
        return endOfPsupGame()
    }

    experimentState.trial += 1
    trialSettings = experimentStateToTrialSettings(experimentState)
    newGame(trialSettings)
}

document.querySelector("#theguess_form").addEventListener("submit", submitGuess)
document.querySelector("#newgame").addEventListener("click", nextRound)
document.querySelector("#trialmax").textContent = EXPERIMENT_SETTINGS.totalTrials

usingMturk = !!parseInt(pageUrl.searchParams.get("usingMturk") || 1)

mturkParams["turkSubmitTo"] = pageUrl.searchParams.get("turkSubmitTo")
mturkParams["hitId"] = pageUrl.searchParams.get("hitId")
mturkParams["study_id"] = EXPERIMENT_SETTINGS.studyName

if (usingMturk) {
    mturkParams["workerId"] = pageUrl.searchParams.get("workerId")
    mturkParams["assignmentId"] = pageUrl.searchParams.get("assignmentId")
}
else {
    mturkParams["workerId"] = browserFingerprintGuid()
    mturkParams["assignmentId"] = uuidv4()
}

chart = new Chart({
    container: 'chart',
    autoFit: true,
    height: 400
});

/*********************************
 * Stuff to handle Part 1 (paper reviewing) portion of the experiment.
 ********************************/

const initializePaperReviewingExperiment = () => {
    if (experimentState.condition == EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_NO_FEEDBACK) {
        document.querySelector("#fig_videogame_points").style.display = "block"
        document.querySelector("#extra_points_caption").style.display = "inline"
    }
    else {
        document.querySelector("#fig_videogame_se").style.display = "block"
    }
}

const updateViewForExperimentStage = (stage) => {
    let viewSettings = viewForExperimentStage(stage)
    _.forEach(viewSettings, (visible, viewId) => {
        document.querySelector(viewId).style.display = visible ? "block" : "none"
    })
}

const goToNextExperimentStage = () => {
    experimentState.stage = nextExperimentStage(experimentState.stage, EXPERIMENT_SETTINGS.experimentStages)
    updateViewForExperimentStage(experimentState.stage)
}

const submitFirstScenario = (event) => {
    event.preventDefault()

    if (!document.querySelector("#first_scenario_checkbox").checked) {
        document.querySelector("#first_scenario_error").style.display = "block"
        return
    }

    recordExperimentState()
    goToNextExperimentStage()
}

const getEditorialResponse = () => {
    let radioNames = ["q_appeal", "q_sample_size", "q_overall"]
    let results = {}
    radioNames.forEach(rn => {
        results[rn] = getRadioButtonValue(rn)

        if (results[rn] === undefined) {
            document.querySelector(`#${rn}_error`).style.display = "block"
        }
        else {
            document.querySelector(`#${rn}_error`).style.display = "none"
        }
    })

    return results
}

const submitEditorialQuestions = (event) => {
    event.preventDefault()
    let editorialResponse = getEditorialResponse()
    if (_.values(editorialResponse).indexOf(undefined) != -1) {
        return
    }

    experimentState['paperA_editorialResponse'] = editorialResponse
    recordExperimentState()
    goToNextExperimentStage()
}

const submitSuperiority = (event) => {
    event.preventDefault()

    experimentState['paperA_superiorityEstimate'] = document.querySelector("#paper_a_superiority_estimate").value

    recordExperimentState()
    goToNextExperimentStage()
}

const submitWhatYouSaw = (event) => {
    event.preventDefault()

    let whatYouSaw = getRadioButtonValue("what_you_saw_radio")
    let whatYouSaw2 = getRadioButtonValue("what_you_saw2_radio")
    let whatYouSaw3 = getRadioButtonValue("what_you_saw3_radio")

    experimentState['paperA_whatYouSaw'] = whatYouSaw
    experimentState['paperA_whatYouSaw2'] = whatYouSaw2
    experimentState['paperA_whatYouSaw3'] = whatYouSaw3

    recordExperimentState()
    goToNextExperimentStage()
}

const submitFeedbackAndEndExperiment = (event) => {
    event.preventDefault()

    experimentState['feedback'] = document.querySelector("#feedback_area").value

    recordExperimentState()

    if (usingMturk) {
        submitToMturk(mturkParams, experimentResults)
    }
    else {
        document.querySelector("#feedback_form").style.display = "none"
        document.querySelector("#finished").style.display = "block"
    }
}

const submitBackgroundSurvey = (event) => {
    event.preventDefault()

    let background = {}

    background['statsTraining'] = collectCheckedValuesByCheckboxName("stats_training_checkbox")
    background['rctComfort'] = getRadioButtonValue("comfort_with_rcts_radio")
    background['allPastActivities'] = collectCheckedValuesByCheckboxName("all_past_activities_checkbox") //todo: decide what to do about the years thing
    background['currentlyDoingResearch'] = getRadioButtonValue("current_research_radio")
    background['yearsExperience'] = getRadioButtonValue("years_experience_radio")

    experimentState['background'] = background

    recordExperimentState()
    goToNextExperimentStage()
}

updateExperiment(1, condition)

initializePaperReviewingExperiment()

// Log an initial page load stage
experimentState.stage = EXPERIMENT_STAGES.INITIAL_PAGE_LOAD
recordExperimentState()

// Revert back to the first stage
experimentState.stage = (pageUrl.searchParams.get("stage") || EXPERIMENT_SETTINGS.experimentStages[0])

updateViewForExperimentStage(experimentState.stage)

//debug interface:
window.updateViewForExperimentStage = updateViewForExperimentStage

document.querySelector("#first_scenario_form").addEventListener("submit", submitFirstScenario)
document.querySelector("#editorial_questions_form").addEventListener("submit", submitEditorialQuestions)
document.querySelector("#superiority_form").addEventListener("submit", submitSuperiority)
document.querySelector("#what_you_saw_form").addEventListener("submit", submitWhatYouSaw)
document.querySelector("#background_survey_form").addEventListener("submit", submitBackgroundSurvey)
document.querySelector("#submit_to_turk_visible").addEventListener("submit", submitFeedbackAndEndExperiment)

M.AutoInit();