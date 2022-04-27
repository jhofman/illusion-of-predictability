import { randn_adj, round100 } from './stats';

export const EXPERIMENTAL_CONDITIONS_ENUM = {
    SE_ONLY: "SE_ONLY",
    SE_POINTS: "SE_POINTS",
    SE_POINTS_ONESHOT: "SE_POINTS_ONESHOT",
    SE_POINTS_FEEDBACK: "SE_POINTS_FEEDBACK",
    SE_NO_FEEDBACK: "SE_NO_FEEDBACK",
    SE_POINTS_NO_FEEDBACK: "SE_POINTS_NO_FEEDBACK",
}

export const EXPERIMENTS_ENUM = {
    PILOT1: "PILOT1",
    PILOT2: "PILOT2",
    PILOT3: "PILOT3",
    PAPER_REVIEW_PILOT1: "PAPER_REVIEW_PILOT1",
    PAPER_REVIEW_PILOT2: "PAPER_REVIEW_PILOT2",
}

export const EXPERIMENT_STAGES = {
    INITIAL_PAGE_LOAD: "INITIAL_PAGE_LOAD",
    PAPER_A_PREFACE: "PAPER_A_PREFACE",
    PAPER_A_REVIEW: "PAPER_A_REVIEW",
    PAPER_A_PSUP: "PAPER_A_PSUP",
    PAPER_A_UNDERSTANDING: "PAPER_A_UNDERSTANDING",
    PSUP_GAME: "PSUP_GAME",
    BACKGROUND_SURVEY: "BACKGROUND_SURVEY",
    FEEDBACK: "FEEDBACK",
}

export const EXPERIMENT_ORDER = [
    EXPERIMENT_STAGES.PAPER_A_PREFACE,
    EXPERIMENT_STAGES.PAPER_A_REVIEW,
    EXPERIMENT_STAGES.PAPER_A_PSUP,
    EXPERIMENT_STAGES.PAPER_A_UNDERSTANDING,
    EXPERIMENT_STAGES.PSUP_GAME,
    EXPERIMENT_STAGES.BACKGROUND_SURVEY,
    EXPERIMENT_STAGES.FEEDBACK,
]

export const nextExperimentStage = (currentStage, experimentStages) => {
    return experimentStages[experimentStages.indexOf(currentStage) + 1]
}

export const viewForExperimentStage = (currentStage) => {
    let view = {
        '#first_scenario': false,
        '#rct': false,
        '#editorial-questions': false,
		'#superiority': false,
        '#what_you_saw': false,
        '#game': false,
        '#background_survey': false,
        "#feedback_form": false,
    }

    if (currentStage == EXPERIMENT_STAGES.PAPER_A_PREFACE) {
        view['#first_scenario'] = true
    }
    else if (currentStage == EXPERIMENT_STAGES.PAPER_A_REVIEW) {
        view['#rct'] = true
        view['#editorial-questions'] = true
    }
    else if (currentStage == EXPERIMENT_STAGES.PAPER_A_PSUP) {
        view['#rct'] = true
		view['#superiority'] = true
    }
    else if (currentStage == EXPERIMENT_STAGES.PAPER_A_UNDERSTANDING) {
		view['#what_you_saw'] = true
    }
    else if (currentStage == EXPERIMENT_STAGES.PSUP_GAME) {
        view['#game'] = true
    }
    else if (currentStage == EXPERIMENT_STAGES.BACKGROUND_SURVEY) {
        view['#background_survey'] = true
    }
    else if (currentStage == EXPERIMENT_STAGES.FEEDBACK) {
        view['#feedback_form'] = true
    }

    return view
}

export const experimentToExperimentSettings = (experiment) => {
    if (experiment == EXPERIMENTS_ENUM.PILOT1) {
        return {
			totalTrials: 20,
			conditionsUsed: [
				EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS,
				EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK, EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT,
			],
			studyName: "psup-pilot-1",
            yoke: true,
            experimentStages: [EXPERIMENT_STAGES.PSUP_GAME],
        }
    }
    else if (experiment == EXPERIMENTS_ENUM.PILOT2) {
        return {
			totalTrials: 5,
			conditionsUsed: [
                EXPERIMENTAL_CONDITIONS_ENUM.SE_NO_FEEDBACK,
				EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS,
			],
			studyName: "psup-pilot-2",
            yoke: false,
            experimentStages: [EXPERIMENT_STAGES.PSUP_GAME],
        }
    }
    else if (experiment == EXPERIMENTS_ENUM.PILOT3) {
        return {
			totalTrials: 5,
			conditionsUsed: [
                EXPERIMENTAL_CONDITIONS_ENUM.SE_NO_FEEDBACK,
				EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS,
			],
			studyName: "psup-pilot-3",
            yoke: false,
            experimentStages: [EXPERIMENT_STAGES.PSUP_GAME],
        }
    }
    else if (experiment == EXPERIMENTS_ENUM.PAPER_REVIEW_PILOT1) {
        return {
			totalTrials: 5,
			conditionsUsed: [ EXPERIMENTAL_CONDITIONS_ENUM.SE_NO_FEEDBACK, EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_NO_FEEDBACK ],
			studyName: "paper-review-pilot-1",
            yoke: false,
            experimentStages: [
                EXPERIMENT_STAGES.PAPER_A_PREFACE,
                EXPERIMENT_STAGES.PAPER_A_REVIEW,
                EXPERIMENT_STAGES.PAPER_A_PSUP,
                EXPERIMENT_STAGES.PAPER_A_UNDERSTANDING,
                EXPERIMENT_STAGES.PSUP_GAME,
                EXPERIMENT_STAGES.FEEDBACK,
            ]
        }
    }
    else if (experiment == EXPERIMENTS_ENUM.PAPER_REVIEW_PILOT2) {
        return {
			totalTrials: 5,
			conditionsUsed: [ EXPERIMENTAL_CONDITIONS_ENUM.SE_NO_FEEDBACK, EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_NO_FEEDBACK ],
			studyName: "paper-review-pilot-2",
            yoke: false,
            experimentStages: [
                EXPERIMENT_STAGES.PAPER_A_PREFACE,
                EXPERIMENT_STAGES.PAPER_A_REVIEW,
                EXPERIMENT_STAGES.PAPER_A_PSUP,
                EXPERIMENT_STAGES.PAPER_A_UNDERSTANDING,
                EXPERIMENT_STAGES.PSUP_GAME,
                EXPERIMENT_STAGES.BACKGROUND_SURVEY,
                EXPERIMENT_STAGES.FEEDBACK,
            ]
        }
    }
}

export function createBars(scenario, trialSettings) {
    let {mu1, mu2, variance1, variance2, n1, n2} = scenario
    let {useSE, useSD} = trialSettings
    let data = []
    if (useSE) {
        data.push({
            name: 1,
            //name: `Treatment (n=${n1})`,
            value: round100(mu1),
            n: n1,
            error: round100(Math.sqrt(variance1/n1)),
            sd: round100(Math.sqrt(variance1))
        })
    }
    if (useSD) {
        data.push({
            name: 2,
            //name: `Treatment data (n=${n1})`,
            value: round100(mu1),
            error: round100(Math.sqrt(variance1)),
            sd: round100(Math.sqrt(variance1)),
            n: n1,
        })
    }
    if (useSE) {
        data.push({
            name: 4,
            //name: `Control (n=${n2})`,
            value: round100(mu2),
            n: n2,
            error: round100(Math.sqrt(variance2/n2)),
            sd: round100(Math.sqrt(variance2)),
        })
    }
    if (useSD) {
        data.push({
            name: 3,
            //name: `Control data (n=${n2})`,
            value: round100(mu2),
            error: round100(Math.sqrt(variance2)),
            sd: round100(Math.sqrt(variance2)),
            n: n2,
        })
    }

    let lowerBound = data[0].value
    let upperBound = data[0].value
    data.forEach((obj) => {
        obj.range = [obj.value - obj.error, obj.value + obj.error];

        if (obj.range[0] < lowerBound) {
            lowerBound = obj.range[0]
        }

        if (obj.range[1] > upperBound) {
            upperBound = obj.range[1]
        }
    });


    return { data, lowerBound, upperBound }
}

export function samplePointsFromScenario(scenario) {
    let {mu1, mu2, variance1, variance2, n1, n2} = scenario

    let sample1 = randn_adj(n1, mu1, Math.sqrt(variance1))
    let sample2 = randn_adj(n2, mu2, Math.sqrt(variance2))
    let data = []

    for (let i=0; i<n1; i++) {
        data.push({
            name: 0.5 + Math.random(),
            xcenter: 1,
            //name: `Treatment (n=${n1})`, 
            value: sample1[i]
        })
    }
    for (let i=0; i<n2; i++) {
        data.push({
            name: 3.5 + Math.random(),
            xcenter: 4,
            //name: `Control (n=${n2})`, 
            value: sample2[i]
        })
    }

    let lowerBound = data[0].value
    let upperBound = data[0].value
    data.forEach((obj) => {
        if (obj.value < lowerBound) {
            lowerBound = obj.value
        }

        if (obj.value > upperBound) {
            upperBound = obj.value
        }
    });

    return {data, lowerBound, upperBound}
}


export const experimentStateToTrialSettingsPilot3 = (experimentState) => {
    let trialSettings = {
        useSE: true,
        useSD: false,
        usePoints: false,
        showTutorial: false,
        showFeedback: false,
        obtainConfirmationPre: false,
        obtainConfirmationPost: false,
    }
    if (experimentState.condition == EXPERIMENTAL_CONDITIONS_ENUM.SE_NO_FEEDBACK) {
        return trialSettings
    }

    else if (experimentState.condition == EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY) {
        trialSettings.showFeedback = true
        return trialSettings
    }

    else if (experimentState.condition == EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_NO_FEEDBACK) {
        trialSettings.usePoints = true

        return trialSettings
    }

    else if (experimentState.condition == EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS) {
        trialSettings.showFeedback = true
        trialSettings.usePoints = true

        return trialSettings
    }
}

export const experimentStateToTrialSettingsPilot2 = (experimentState) => {
    let trialSettings = {
        useSE: true,
        useSD: false,
        usePoints: false,
        showTutorial: false,
        showFeedback: false,
        obtainConfirmationPre: false,
        obtainConfirmationPost: false,
    }
    if (experimentState.condition == EXPERIMENTAL_CONDITIONS_ENUM.SE_NO_FEEDBACK) {
        return trialSettings
    }

    else if (experimentState.condition == EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY) {
        trialSettings.showFeedback = true
        return trialSettings
    }

    else if (experimentState.condition == EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS) {
        trialSettings.showFeedback = true

        if (experimentState.trial == 2) {
            trialSettings.obtainConfirmationPre = true
        }

        if (experimentState.trial == 5) {
            trialSettings.obtainConfirmationPost = true
        }

        if ([2, 3, 4].indexOf(experimentState.trial) != -1) {
            trialSettings.usePoints = true
        }

        return trialSettings
    }
}

export const experimentStateToTrialSettingsPilot1 = (experimentState) => {
    let trialSettings = {
        useSE: false,
        useSD: false,
        usePoints: false,
        showTutorial: false,
        showFeedback: false,
        obtainConfirmationPre: false,
        obtainConfirmationPost: false,
    }

    if ((experimentState.trial <= 5) || (experimentState.trial >= 16)) {
        trialSettings.useSE = true

        if (experimentState.condition == EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS && (experimentState.trial == 16)) {
            trialSettings.obtainConfirmationPost = true
        }
        return trialSettings
    }

    if (experimentState.condition == EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY) {
        trialSettings.useSE = true
        trialSettings.showFeedback = true

        return trialSettings
    }

    if (experimentState.condition == EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT) {
        trialSettings.useSE = true
        trialSettings.showFeedback = true

        if (experimentState.trial == 6) {
            trialSettings.usePoints = true
            trialSettings.obtainConfirmationPre = true
        }

        if (experimentState.trial == 7) {
            trialSettings.obtainConfirmationPost = true
        }

        return trialSettings
    }

    if (experimentState.condition == EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS) {
        trialSettings.useSE = true
        trialSettings.usePoints = true
        trialSettings.showFeedback = true

        if (experimentState.trial == 6) {
            trialSettings.obtainConfirmationPre = true
        }

        return trialSettings
    }

    if (experimentState.condition == EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK) {
        trialSettings.useSE = true
        trialSettings.showTutorial = true
        trialSettings.showFeedback = true

        return trialSettings
    }
}

export const experimentStateToTrialSettings = (experimentState) => {
    if (experimentState.experiment == EXPERIMENTS_ENUM.PILOT1) {
        return experimentStateToTrialSettingsPilot1(experimentState)
    }
    else if (experimentState.experiment == EXPERIMENTS_ENUM.PILOT2) {
        return experimentStateToTrialSettingsPilot2(experimentState)
    }
    else if (experimentState.experiment == EXPERIMENTS_ENUM.PILOT3) {
        return experimentStateToTrialSettingsPilot3(experimentState)
    }
    else if (experimentState.experiment == EXPERIMENTS_ENUM.PAPER_REVIEW_PILOT1) {
        return experimentStateToTrialSettingsPilot3(experimentState)
    }
    else if (experimentState.experiment == EXPERIMENTS_ENUM.PAPER_REVIEW_PILOT2) {
        return experimentStateToTrialSettingsPilot3(experimentState)
    }
}