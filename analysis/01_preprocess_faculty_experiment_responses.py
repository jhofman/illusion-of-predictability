# ---
# jupyter:
#   jupytext:
#     formats: ipynb,py:light
#     text_representation:
#       extension: .py
#       format_name: light
#       format_version: '1.5'
#       jupytext_version: 1.13.8
#   kernelspec:
#     display_name: Python 3
#     language: python
#     name: python3
# ---

# # Faculty Analysis
#
# Mostly this notebook is pre-processing and tidying the data for the R analysis.

# ## Loading the data from mturk

# +
from ast import literal_eval
from itertools import chain
from datetime import datetime, date
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import json

pd.set_option('display.max_columns', 50)
# %matplotlib inline
# -

experiment = "faculty"

# +
df = pd.read_csv(f"../raw-data/{experiment}.csv")

df.head()
# -

print(f"Overall, there are {df.assignment_id.nunique()} unique assignmentIds")

df.assignment_id.value_counts().value_counts()

# # Analysis of Part I
#
# Since we have more data for Part I of the experiment, let's look at that first.

stage_markers = df[df.variable == 'experiment'].index

# +
df_stages = []

for stage_start, stage_end in zip(stage_markers, np.concatenate([stage_markers[1:], [len(df)]])):
    df_stage = df.iloc[stage_start:stage_end]
    df_stage_pivoted = df_stage.pivot(index='assignment_id', columns='variable', values='value')
    
    df_stages.append(df_stage_pivoted)


# +
def literal_eval_if_present(val):
    if pd.isnull(val):
        return val
    
    return literal_eval(val)


def get_if_present(col, val):
    if pd.isnull(val):
        return val
    
    return val[col]


def in_get_if_present(col, inner, val):
    gotten = get_if_present(col, val)
    
    try:
        return inner in gotten
    except TypeError:
        return gotten
    

def int_if_present(val):
    if pd.isnull(val):
        return val
    
    return int(val)

df_by_stage = pd.concat(df_stages)
df_by_stage['paperA_editorialResponse'] = df_by_stage['paperA_editorialResponse'].apply(literal_eval_if_present)
df_by_stage['scenario'] = df_by_stage['scenario'].apply(literal_eval_if_present)
df_by_stage['background'] = df_by_stage['background'].apply(literal_eval_if_present)
df_by_stage['guess'] = df_by_stage['guess'].apply(int_if_present)
df_by_stage['currentTime'] = df_by_stage['currentTime'].apply(int_if_present)
df_by_stage['startTime'] = df_by_stage['startTime'].apply(int_if_present)

{'departmentField': 'statistics',
 'isTenureTrackFaculty': 'no',
 'comfortWithStats': '5',
 'comfortWithData': '5',
 'taughtStats': 'Yes',
 'papersReviewed': '50-100'}

editorialQs = ['q_appeal', 'q_sample_size', 'q_overall']
scenarioVars = ['mu1', 'mu2', 'variance1', 'variance2', 'n1', 'n2', 'probOfSuperiority']
statsVars = ['departmentField', 'isTenureTrackFaculty', 'comfortWithStats', 'comfortWithData', 'taughtStats', 'papersReviewed']

for q in editorialQs:
    df_by_stage[q] = df_by_stage.paperA_editorialResponse.apply(lambda x: get_if_present(q, x))

for v in scenarioVars:
    df_by_stage[v] = df_by_stage.scenario.apply(lambda x: get_if_present(v, x))

for v in statsVars:
    df_by_stage[v] = df_by_stage.background.apply(lambda x: get_if_present(v, x))

df_by_stage.head()

# +
# Filter faculty who replied after Thursday August 26th

print("Before filtering on date: ", len(df_by_stage))
df_by_stage = df_by_stage[(df_by_stage['startTime'] / 1000).apply(lambda x: datetime.fromtimestamp(x).date()) <= date(2021, 8, 26)]
print("After removing responses after August 26th, 2021: ", len(df_by_stage))

# +
df_trials = df_by_stage[~df_by_stage.trial.isnull()]

# only keep people who finished all 5 trials
df_trials = df_trials[
    df_trials.groupby('assignmentId').trial.transform('count') == 5
]

df_trials['psup'] = (df_trials.probOfSuperiority*100).astype(int)
df_trials['signed_error'] = df_trials.guess - df_trials.psup
df_trials['unsigned_error'] = np.abs(df_trials.guess - df_trials.psup)
# -

# # Feedback

df_by_stage[df_by_stage.stage == 'FEEDBACK'].feedback.dropna().values

df_by_stage[df_by_stage.stage == 'FEEDBACK'].dropna(subset=['feedback'])[['assignmentId', 'workerId', 'condition', 'feedback']].to_csv(f"../tidy-data/{experiment}-tidy-feedback.tsv", sep="\t")

# ### Timing data
#
# We recorded timestamps of the start and end in milliseconds since the Epoch. Mostly we are curious if they are completing the task too quickly (<3 minutes?)

df_by_stage['elapsed'] = df_by_stage['currentTime'] - df_by_stage['startTime']

end_of_part1 = df_by_stage[df_by_stage.stage == 'PSUP_GAME_PREFACE'].currentTime - df_by_stage[df_by_stage.stage == 'PSUP_GAME_PREFACE'].startTime
feedback_stage = df_by_stage[df_by_stage.stage == 'FEEDBACK'].currentTime - df_by_stage[df_by_stage.stage == 'FEEDBACK'].startTime

# +
fig, ax = plt.subplots(1, 1, figsize=(6, 4))
ax.scatter(
    range(len(feedback_stage)),
    (feedback_stage / 1000 / 60).sort_values(),
)

ax.set_xlabel("Participants ordered by time")
ax.set_xticks([])
ax.set_ylabel("Experiment time in minutes")
ax.set_ylim([0, 100])
# -

# # Cleanup before outputting
#
# We want the data to be tidy. Thus we will end up with four dataframes:
#
# * first is editorial
# * second is psup game 
# * third is time stamps, with all stages (and maybe ts_trial_1, ts_trial_2, etc. for psup game?)
# * fourth is background survey

df_last_stage_per_assignment = df_by_stage.sort_values(by=['assignmentId', 'elapsed']).groupby('assignment_id').last()

# +
# New rule is that editorial data must have Part I of experiment completed
# (ie, finished the PAPER_A_UNDERSTANDING stage)

df_tidy_editorial = df_by_stage[df_by_stage.stage == 'PAPER_A_UNDERSTANDING'].drop(['currentTime', 'startTime', 'turkSubmitTo', 'guess', 'scenario', 'trial', 'background', 'feedback', 'mu1', 'mu2', 'variance1', 'variance2', 'n1', 'n2', 'probOfSuperiority'] + statsVars, axis=1)
df_tidy_editorial.to_csv(f"../tidy-data/{experiment}-tidy-editorial.csv", index=False)

# +
# How much data will we lose if we require people finish Part I completely?

print("Number of people who made it to various stages:")
print(df_by_stage.drop_duplicates(['assignmentId', 'stage']).stage.value_counts())
# -

with open(f"./results/{experiment}_finishers_by_stage.json", "w") as out:
    json.dump(
        df_by_stage.drop_duplicates(['assignmentId', 'stage']).stage.value_counts().reset_index().rename(columns={'index': 'stage', 'stage': 'finishers'}).set_index("stage").to_dict()['finishers'],
        out
    )

common_vars = ['assignmentId', 'condition', 'experiment', 'hitId', 'id', 'study_id', 'workerId', ]

# +
# Writing out psup game trials

df_trials[common_vars + ['guess', 'trial', 'mu1', 'mu2', 'variance1', 'variance2', 'n1', 'n2', 'psup', 'signed_error', 'unsigned_error']].to_csv(f"../tidy-data/{experiment}-tidy-psup-game.csv", index=False)

# +
# Writing out background data

df_background_data = df_last_stage_per_assignment[common_vars + statsVars]
df_background_data.to_csv(f"../tidy-data/{experiment}-tidy-background.csv", index=False)

# +
# Writing out timing data

df_by_stage['stage_trial'] = df_by_stage.stage + '-' + df_by_stage.trial.fillna('1')
df_by_stage[common_vars + ['stage', 'trial', 'stage_trial', 'elapsed']].to_csv(f"../tidy-data/{experiment}-tidy-elapsed.csv", index=False)
