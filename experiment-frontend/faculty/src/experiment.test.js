import {
	experimentStateToTrialSettings, experimentToExperimentSettings,
	EXPERIMENTAL_CONDITIONS_ENUM, EXPERIMENTS_ENUM, EXPERIMENT_STAGES
} from "./experiment"
import _ from 'lodash'

describe("Paper reviewing pilot 2 (or overall Pilot 5)", () => {
	test("Experiment settings for paper reviewing pilot 2", () => {
		expect(experimentToExperimentSettings(EXPERIMENTS_ENUM.PAPER_REVIEW_PILOT2)).toMatchObject({
			totalTrials: 5,
			conditionsUsed: [EXPERIMENTAL_CONDITIONS_ENUM.SE_NO_FEEDBACK, EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_NO_FEEDBACK],
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
		})
	})
})

describe("Paper reviewing pilot 1 (or overall Pilot 4)", () => {
	test("Experiment settings for paper reviewing pilot 1", () => {
		expect(experimentToExperimentSettings(EXPERIMENTS_ENUM.PAPER_REVIEW_PILOT1)).toMatchObject({
			totalTrials: 5,
			conditionsUsed: [EXPERIMENTAL_CONDITIONS_ENUM.SE_NO_FEEDBACK, EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_NO_FEEDBACK],
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
		})
	})
})

describe("Pilot 3", () => {
	test("Experiment settings for Pilot 2", () => {
		expect(experimentToExperimentSettings(EXPERIMENTS_ENUM.PILOT3)).toMatchObject({
			totalTrials: 5,
			conditionsUsed: [EXPERIMENTAL_CONDITIONS_ENUM.SE_NO_FEEDBACK, EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS],
			studyName: "psup-pilot-3",
			yoke: false,
			experimentStages: [EXPERIMENT_STAGES.PSUP_GAME]
		})
	})

	test.each(_.range(1, 6))("No feedback condition shows no feedback", (trial) => {
		expect(experimentStateToTrialSettings({
			experiment: EXPERIMENTS_ENUM.PILOT3,
			condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_NO_FEEDBACK,
			trial: trial
		})).toMatchObject({
			useSE: true,
			useSD: false,
			usePoints: false,
			showTutorial: false,
			showFeedback: false,
			obtainConfirmationPre: false,
			obtainConfirmationPost: false,
		})
	})

	test.each(_.range(1, 6))("SE_ONLY condition is constant across trials", (trial) => {
		expect(experimentStateToTrialSettings({
			experiment: EXPERIMENTS_ENUM.PILOT3,
			condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY,
			trial: trial
		})).toMatchObject({
			useSE: true,
			useSD: false,
			usePoints: false,
			showTutorial: false,
			showFeedback: true,
			obtainConfirmationPre: false,
			obtainConfirmationPost: false,
		})
	})

	test.each(_.range(1, 6))("SE_POINTS condition is constant across trials", (trial) => {
		expect(experimentStateToTrialSettings({
			experiment: EXPERIMENTS_ENUM.PILOT3,
			condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS,
			trial: 1
		})).toMatchObject({
			useSE: true,
			useSD: false,
			usePoints: true,
			showTutorial: false,
			showFeedback: true,
			obtainConfirmationPre: false,
			obtainConfirmationPost: false,
		})
	})
})

describe("Pilot 2", () => {
	test("Experiment settings for Pilot 2", () => {
		expect(experimentToExperimentSettings(EXPERIMENTS_ENUM.PILOT2)).toMatchObject({
			totalTrials: 5,
			conditionsUsed: [EXPERIMENTAL_CONDITIONS_ENUM.SE_NO_FEEDBACK, EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS],
			studyName: "psup-pilot-2",
			yoke: false,
			experimentStages: [EXPERIMENT_STAGES.PSUP_GAME]
		})
	})

	test.each(_.range(1, 6))("No feedback condition shows no feedback", (trial) => {
		expect(experimentStateToTrialSettings({
			experiment: EXPERIMENTS_ENUM.PILOT2,
			condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_NO_FEEDBACK,
			trial: trial
		})).toMatchObject({
			useSE: true,
			useSD: false,
			usePoints: false,
			showTutorial: false,
			showFeedback: false,
			obtainConfirmationPre: false,
			obtainConfirmationPost: false,
		})
	})

	test.each(_.range(1, 6))("SE_ONLY condition is constant across trials", (trial) => {
		expect(experimentStateToTrialSettings({
			experiment: EXPERIMENTS_ENUM.PILOT2,
			condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY,
			trial: trial
		})).toMatchObject({
			useSE: true,
			useSD: false,
			usePoints: false,
			showTutorial: false,
			showFeedback: true,
			obtainConfirmationPre: false,
			obtainConfirmationPost: false,
		})
	})

	describe("SE_POINTS condition", () => {
		test("Only shows SE on trial 1", () => {
			expect(experimentStateToTrialSettings({
				experiment: EXPERIMENTS_ENUM.PILOT2,
				condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS,
				trial: 1
			})).toMatchObject({
				useSE: true,
				useSD: false,
				usePoints: false,
				showTutorial: false,
				showFeedback: true,
				obtainConfirmationPre: false,
				obtainConfirmationPost: false,
			})
		})

		test("Shows SE, points, and pre-confirmation on trial 2", () => {
			expect(experimentStateToTrialSettings({
				experiment: EXPERIMENTS_ENUM.PILOT2,
				condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS,
				trial: 2
			})).toMatchObject({
				useSE: true,
				useSD: false,
				usePoints: true,
				showTutorial: false,
				showFeedback: true,
				obtainConfirmationPre: true,
				obtainConfirmationPost: false,
			})
		})

		test("Shows SE, points on trial 3", () => {
			expect(experimentStateToTrialSettings({
				experiment: EXPERIMENTS_ENUM.PILOT2,
				condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS,
				trial: 3
			})).toMatchObject({
				useSE: true,
				useSD: false,
				usePoints: true,
				showTutorial: false,
				showFeedback: true,
				obtainConfirmationPre: false,
				obtainConfirmationPost: false,
			})
		})

		test("Shows SE, points on trial 4", () => {
			expect(experimentStateToTrialSettings({
				experiment: EXPERIMENTS_ENUM.PILOT2,
				condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS,
				trial: 4
			})).toMatchObject({
				useSE: true,
				useSD: false,
				usePoints: true,
				showTutorial: false,
				showFeedback: true,
				obtainConfirmationPre: false,
				obtainConfirmationPost: false,
			})
		})

		test("Shows SE and post-confirmation on trial 5", () => {
			expect(experimentStateToTrialSettings({
				experiment: EXPERIMENTS_ENUM.PILOT2,
				condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS,
				trial: 5
			})).toMatchObject({
				useSE: true,
				useSD: false,
				usePoints: false,
				showTutorial: false,
				showFeedback: true,
				obtainConfirmationPre: false,
				obtainConfirmationPost: true,
			})
		})

	})
})

describe("Pilot 1", () => {
	test("Experiment settings for Pilot 1", () => {
		expect(experimentToExperimentSettings(EXPERIMENTS_ENUM.PILOT1)).toMatchObject({
			totalTrials: 20,
			conditionsUsed: [
				EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS,
				EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK, EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT,
			],
			studyName: "psup-pilot-1",
			yoke: true,
			experimentStages: [EXPERIMENT_STAGES.PSUP_GAME]
		})
	})

	test.each([
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, 1],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, 2],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, 3],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, 4],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, 5],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS, 1],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS, 2],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS, 3],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS, 4],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS, 5],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT, 1],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT, 2],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT, 3],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT, 4],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT, 5],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK, 1],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK, 2],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK, 3],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK, 4],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK, 5],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, 16],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, 17],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, 18],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, 19],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY, 20],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS, 17],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS, 18],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS, 19],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS, 20],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT, 16],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT, 17],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT, 18],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT, 19],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT, 20],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK, 16],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK, 17],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK, 18],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK, 19],
		[EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK, 20],
	])("All conditions use SEs without feedback in first and last five trials", (condition, trial) => {
		let trialSettings = experimentStateToTrialSettings({
			experiment: EXPERIMENTS_ENUM.PILOT1,
			condition: condition,
			trial: trial
		})

		expect(trialSettings).toMatchObject({
			useSE: true,
			useSD: false,
			usePoints: false,
			showTutorial: false,
			showFeedback: false,
			obtainConfirmationPre: false,
			obtainConfirmationPost: false,
		})
	})

	test.each(_.range(6, 16))("SE_ONLY condition gives feedback during trials 6-15", (trial) => {
		let trialSettings = experimentStateToTrialSettings({
			experiment: EXPERIMENTS_ENUM.PILOT1,
			condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_ONLY,
			trial: trial
		})

		expect(trialSettings).toMatchObject({
			useSE: true,
			useSD: false,
			usePoints: false,
			showTutorial: false,
			showFeedback: true,
			obtainConfirmationPre: false,
			obtainConfirmationPost: false,
		})
	})

	test.each([
		EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS,
		EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT,
	])("SE_POINTS and SE_POINTS_ONESHOT asks for pre-confirmation on trial 6", (condition) => {
		expect(experimentStateToTrialSettings({
			experiment: EXPERIMENTS_ENUM.PILOT1,
			condition: condition,
			trial: 6
		})).toMatchObject({
			useSE: true,
			useSD: false,
			usePoints: true,
			showTutorial: false,
			showFeedback: true,
			obtainConfirmationPre: true,
			obtainConfirmationPost: false,
		})
	})

	test("SE_POINTS_ONESHOT asks for confirmation before trial 7", () => {
		expect(experimentStateToTrialSettings({
			experiment: EXPERIMENTS_ENUM.PILOT1,
			condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT,
			trial: 7
		})).toMatchObject({
			useSE: true,
			useSD: false,
			usePoints: false,
			showTutorial: false,
			showFeedback: true,
			obtainConfirmationPre: false,
			obtainConfirmationPost: true,
		})
	})

	test.each(_.range(8, 16))("SE_POINTS_ONESHOT only shows SE and feedback on trials 8-15", (trial) => {
		expect(experimentStateToTrialSettings({
			experiment: EXPERIMENTS_ENUM.PILOT1,
			condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_ONESHOT,
			trial: trial
		})).toMatchObject({
			useSE: true,
			useSD: false,
			usePoints: false,
			showTutorial: false,
			showFeedback: true,
			obtainConfirmationPre: false,
			obtainConfirmationPost: false,
		})
	})

	test.each(_.range(7, 16))("SE_POINTS shows SE and points on trials 7-15", (trial) => {
		expect(experimentStateToTrialSettings({
			experiment: EXPERIMENTS_ENUM.PILOT1,
			condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS,
			trial: trial
		})).toMatchObject({
			useSE: true,
			useSD: false,
			usePoints: true,
			showTutorial: false,
			showFeedback: true,
			obtainConfirmationPre: false,
			obtainConfirmationPost: false,
		})
	})

	test.each(_.range(6, 16))("SE_POINTS_FEEDBACK shows tutorials after each round from 6-15", (trial) => {
		expect(experimentStateToTrialSettings({
			experiment: EXPERIMENTS_ENUM.PILOT1,
			condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS_FEEDBACK,
			trial: trial
		})).toMatchObject({
			useSE: true,
			useSD: false,
			usePoints: false,
			showTutorial: true,
			showFeedback: true,
			obtainConfirmationPre: false,
			obtainConfirmationPost: false,
		})
	})

	test("SE_POINTS asks for confirmation before trial 16", () => {
		expect(experimentStateToTrialSettings({
			experiment: EXPERIMENTS_ENUM.PILOT1,
			condition: EXPERIMENTAL_CONDITIONS_ENUM.SE_POINTS,
			trial: 16
		})).toMatchObject({
			useSE: true,
			useSD: false,
			usePoints: false,
			showTutorial: false,
			showFeedback: false,
			obtainConfirmationPre: false,
			obtainConfirmationPost: true,
		})
	})

})
