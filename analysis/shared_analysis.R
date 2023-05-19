library(here)
library(ggeffects)
library(ggbeeswarm)
library(DT)
library(sandwich)
library(lmtest)
library(papaja)
library(tidyverse)

read_ds_bg <- function() {
  experiment = "datascientists"
  background_ds <- read.csv(here(paste("tidy-data/", experiment, "-tidy-background.csv", sep=""))) %>% filter(!is.na(rctComfort))
  
  background_ds
}

read_faculty_bg <- function() {
  faculty_experiment = "faculty"
  background_data <- read.csv(here(paste("tidy-data/", faculty_experiment, "-tidy-background.csv", sep=""))) %>% filter(!is.na(departmentField))
  
  background_data
}

read_ds_data <- function(background_ds) {
  experiment = "datascientists"
  background_with_number_done <- background_ds %>% 
    rename(is_phd=has_phd) %>%  # the has_ variables are part of the "past activities" question, except for has_phd
    select(assignmentId, starts_with("has_")) %>% 
    mutate(across(starts_with("has_"), as.logical)) %>%
    mutate(across(starts_with("has_"), as.integer)) %>%
    rowwise() %>%
    mutate(number_done = sum(across(starts_with("has_"))))
  
  
  assignments_to_drop1 = background_ds %>% 
    filter((has_any_stats_training == 0) | (rctComfort == 1)) %>%
    select(assignmentId)
  
  assignments_to_drop = c(
    background_with_number_done %>%
      filter(number_done == 0) %>% select(assignmentId),
    assignments_to_drop1)
  
  datascientist_trials <- read.csv(here(paste("tidy-data/", experiment, "-tidy-psup-game.csv", sep=""))) %>%
    filter(!(assignmentId %in% assignments_to_drop))
  
  datascientist_editorial_data <- read.csv(here(paste("tidy-data/", experiment, "-tidy-editorial.csv", sep=""))) %>%
    mutate(condition = recode_factor(condition, SE_NO_FEEDBACK="SE Only", SE_POINTS_NO_FEEDBACK="SE + Points")) %>%
    filter(!(assignmentId %in% assignments_to_drop)) %>%
    mutate(q_overall = 6 - q_overall) # undo reverse coding
  
  list(datascientist_trials=datascientist_trials, datascientist_editorial_data=datascientist_editorial_data)
}

read_faculty_data <- function(background_data) {
  faculty_experiment = "faculty"
  
  assignments_to_drop = background_data %>% 
    filter((isTenureTrackFaculty == "no") | (comfortWithStats == 1) | (comfortWithData == 1) | (papersReviewed == 0)) %>%
    select(assignmentId)
  
  faculty_trials <- read.csv(here(paste("tidy-data/", faculty_experiment, "-tidy-psup-game.csv", sep=""))) %>%
    filter(!(assignmentId %in% assignments_to_drop))
  
  faculty_editorial_data <- read.csv(here(paste("tidy-data/", faculty_experiment, "-tidy-editorial.csv", sep=""))) %>%
    mutate(condition = recode_factor(condition, SE_NO_FEEDBACK="SE Only", SE_POINTS_NO_FEEDBACK="SE + Points")) %>%
    filter(!(assignmentId %in% assignments_to_drop) & stage == "PAPER_A_UNDERSTANDING") %>%
    mutate(q_overall = 6 - q_overall) # undo reverse coding
  
  list(faculty_trials=faculty_trials, faculty_editorial_data=faculty_editorial_data)
}

remove_dollar_signs <- function(x) {
  gsub("\\$", "", x)
}


plot_editorial_data <- function(editorial) {
  editorial_responses_long <- editorial %>%
    select(assignmentId, workerId, condition, matches('q_')) %>%
    pivot_longer(matches('q_'), names_to = "variable", values_to = "value") %>%
    filter(!is.na(value))
  
  # note: jitter in x only or only a little in the y, rather?
  
  ratings <- data.frame(
    value = 1:5,
    Rating = fct_rev(as.factor(c("1 (Strongly negative)", "2", "3", "4", "5 (Strongly positive)")))
    )
  
  prettier_editorial_data <- editorial_responses_long %>%
    mutate(variable=recode_factor(variable, "q_appeal"="Appeal of work",
                                  "q_sample_size"="Sufficient sample size",
                                  "q_overall"="Recommendation")) %>%
    left_join(ratings)
  
  plot_data <- prettier_editorial_data %>%
    count(condition, Rating, variable, value) %>%
    group_by(condition, variable) %>%
    mutate(frac = n / sum(n))
  
  summary_data <- prettier_editorial_data %>%
    group_by(condition, variable) %>%
    summarize(mu = mean(value),
              se = sd(value) / sqrt(n())) %>%
    mutate(mu_rescaled = (mu - 1) / 4,
           se_rescaled = (se - 1) / 4)
  
  ggplot(plot_data, aes(x = value, y = frac, fill = condition)) +
      geom_bar(stat = "identity", position = "identity", width = 0.95, alpha = 0.6) +
      geom_errorbarh(data = summary_data, aes(x = mu, xmin = mu - se, xmax = mu + se, y = 1.1*max(plot_data$frac), color = condition), height = 0.025) +
      geom_point(data = summary_data, aes(x = mu, y = 1.1*max(plot_data$frac), color = condition), size = 0.5) +
      facet_wrap( ~ variable) +
      scale_y_continuous(label = label_percent(accuracy = 1)) +
      labs(x = 'Rating', y = 'Percent of responses') +
      theme(legend.position = "bottom")
  
}

editorial_tests <- function(editorial) {
  paper_psup_ds = editorial %>% filter(!is.na(paperA_superiorityEstimate))
  editorial_responses_long <- editorial %>%
    select(assignmentId, workerId, condition, matches('q_')) %>%
    pivot_longer(matches('q_'), names_to = "variable", values_to = "value") %>%
    filter(!is.na(value))
  
  appeal_t_stats <- (editorial_responses_long %>%
    filter(variable == "q_appeal") %>%
    t.test(value ~ condition, data = .) %>%
    apa_print())$statistic %>%
    remove_dollar_signs()
  
  overall_t_stats <- (editorial_responses_long %>%
    filter(variable == "q_overall") %>%
    t.test(value ~ condition, data = .) %>%
    apa_print())$statistic %>%
    remove_dollar_signs()
  
  sample_t_stats <- (editorial_responses_long %>%
    filter(variable == "q_sample_size") %>%
    t.test(value ~ condition, data = .) %>%
    apa_print())$statistic %>%
    remove_dollar_signs()
  
  editorial_psup_summaries =  paper_psup_ds %>%
    group_by(condition) %>%
    summarize(
      mu=mean(paperA_superiorityEstimate),
      sd=sd(paperA_superiorityEstimate),
    )
  
  paper_psup_t_stats <- apa_print(t.test(paperA_superiorityEstimate ~ condition, data = paper_psup_ds))$statistic %>%
    remove_dollar_signs()
  
  # Extreme values (means)
  paper_psup_extreme_props <- paper_psup_ds %>%
    mutate(extreme = paperA_superiorityEstimate > 90) %>%
      group_by(condition) %>%
      summarize(num_extreme = sum(extreme),
                prop_extreme = num_extreme / n())
      
  # Extreme values (t-stats)
  paper_psup_extreme_t_stats <- (paper_psup_ds %>%
    mutate(extreme = paperA_superiorityEstimate > 90) %>%
    t.test(extreme ~ condition, data=.) %>%
    apa_print())$statistic %>%
    remove_dollar_signs()
  
  list(
    appeal_t_stats=appeal_t_stats, overall_t_stats=overall_t_stats,
    sample_t_stats=sample_t_stats,
    paper_psup_extreme_t_stats=paper_psup_extreme_t_stats,
    paper_psup_extreme_props=paper_psup_extreme_props,
    paper_psup_t_stats=paper_psup_t_stats,
    editorial_psup_summaries=editorial_psup_summaries
  )
}

plot_beeswarm_two_conditions_with_truth <- function(data, truth, x_var, y_var, cex=2) {
  if (typeof(truth) == "double") {
    truth_line = geom_abline(slope=0, intercept=truth, linetype="dashed")
  }
  else {
    truth_line = geom_hline(data = truth, aes(yintercept = 100*auc), linetype = 'dashed')
  }
  
  ggplot(data, aes_string(x=x_var, y=y_var)) +
    geom_beeswarm(mapping=aes_string(color=x_var), cex=cex, method='center', alpha=0.5) +
  #  scale_color_manual(values=c("#af8dc3", "#7fbf7b")) +
    stat_summary(fun = mean, geom = "point", size=1.2) +
    stat_summary(fun.data="mean_se",  fun.args = list(mult=1), 
                 geom="errorbar", color = "black", width=0.1) +
    theme(legend.position = "none") +
    truth_line
}

plot_editorial_psup <- function(editorial_data, cex=2) {
  paper_psup_ds = editorial_data %>% filter(!is.na(paperA_superiorityEstimate))
  
  plottable <- paper_psup_ds %>%
    mutate(
      condition=recode_factor(condition, "SE Only"="SEs only", "SE + Points"="SEs + Points")
    )
  
  plot_beeswarm_two_conditions_with_truth(plottable, 59, "condition", "paperA_superiorityEstimate", cex=cex) +
    xlab("Condition") +
    ylab("Estimated probability\nof superiority") +
    scale_y_continuous(label = function(x) paste0(x, "%"))
}

plot_whatYouSaw_q1 <- function(editorial_data) {
  paper_psup_ds = editorial_data %>% filter(!is.na(paperA_superiorityEstimate))
  
  paper_psup_ds %>% group_by(condition) %>%
    count(paperA_whatYouSaw) %>%
    mutate(
      frac=n/sum(n),
      se=sqrt(frac*(1 - frac)/n),
      paperA_whatYouSaw=recode_factor(paperA_whatYouSaw, recalled_1_se="1 SE", recalled_1_sd="1 SD", recalled_2_sd="2 SD", recalled_2_se="2 SE")
    ) %>%
    ggplot(aes(x=paperA_whatYouSaw, y=frac, fill=condition)) +
      #geom_bar(position="dodge", stat="identity", width=.25) +
      geom_pointrange(aes(x=paperA_whatYouSaw, ymin=frac - se, ymax=frac + se, color=condition), position=position_dodge(width=0.25)) +
      scale_y_continuous(label=percent) +
    coord_cartesian(ylim=c(0, 1)) +
    xlab("What kind of error bars were recalled?") +
    ylab("Percent of responses") +
      theme(legend.position = "top")
}

plot_whatYouSaw_q2 <- function(editorial) {
  paper_psup_ds = editorial %>% filter(!is.na(paperA_superiorityEstimate))
  
  paper_whatYouSaw2 <-  paper_psup_ds %>% group_by(condition) %>%
    count(paperA_whatYouSaw2) %>%
    mutate(
      frac=n/sum(n),
      se=sqrt(frac*(1 - frac)/n)
    )
  
  recalled_avg_means <- paper_whatYouSaw2 %>%
    filter(paperA_whatYouSaw2 == "recalled_uncert_avg")
  
  ggplot(recalled_avg_means, aes(x=condition, y=frac)) +
      #geom_bar(position="dodge", stat="identity", width=.25) +
      geom_pointrange(aes(x=condition, ymin=frac - se, ymax=frac + se, color=condition)) +
      scale_y_continuous(label=percent, lim=c(0, 1)) +
      theme(legend.position="none") +
    ylab("% who recalled uncertainty in estimating the average")
}

plot_accuracy_vs_recalled <- function(editorial, condition) {
  paper_psup_ds = editorial %>% filter(!is.na(paperA_superiorityEstimate))
  
  paper_psup_ds %>% 
    mutate(paperA_whatYouSaw2 = recode_factor(paperA_whatYouSaw2, recalled_uncert_avg="average", recalled_uncert_pop="population")) %>%
    ggplot(aes(x=paperA_whatYouSaw2, y=paperA_superiorityEstimate, color=paperA_whatYouSaw2)) +
      facet_wrap(~ condition, ncol = 2) +
      geom_point(position = position_jitter(width=0.15)) +
      stat_summary(fun = mean, geom = "point", size=1.2) +
      stat_summary(fun.data="mean_se",  fun.args = list(mult=1), 
                   geom="errorbar", color = "black", width=0.1) +
      theme(legend.position = "none") +
      geom_abline(slope=0, intercept=59, linetype="dashed") +
      xlab("Recalled error bars signified uncertainty in...") +
      ylab("Probability of superiority estimate")
}

recalled_tests_q1 <- function(editorial) {
  paper_psup_ds = editorial %>% filter(!is.na(paperA_superiorityEstimate))
  
  whatYouSaw <- paper_psup_ds %>% group_by(condition) %>%
    count(paperA_whatYouSaw) %>%
    mutate(
      frac=n/sum(n),
      se=sqrt(frac*(1 - frac)/n),
      paperA_whatYouSaw=recode_factor(paperA_whatYouSaw, recalled_1_se="1 SE", recalled_1_sd="1 SD", recalled_2_sd="2 SD", recalled_2_se="2 SE")
    )
  
  whatYouSaw_SEvsSD <- paper_psup_ds %>%
    mutate(whatYouSaw=substring(paperA_whatYouSaw, nchar(paperA_whatYouSaw) - 1, nchar(paperA_whatYouSaw))) %>%
    group_by(condition) %>%
    count(whatYouSaw) %>%
    mutate(
      frac=n/sum(n),
      se=sqrt(frac*(1 - frac)/n),
      whatYouSaw=recode_factor(whatYouSaw, se="SE", sd="SD")
    )
    
  list(whatYouSaw=whatYouSaw, whatYouSaw_SEvsSD=whatYouSaw_SEvsSD)
}

recalled_tests <- function(editorial) {
  paper_psup_ds = editorial %>% filter(!is.na(paperA_superiorityEstimate))
  
  paper_whatYouSaw2 <-  paper_psup_ds %>% group_by(condition) %>%
    count(paperA_whatYouSaw2) %>%
    mutate(
      frac=n/sum(n),
      se=sqrt(frac*(1 - frac)/n)
    )
  
  
  recalled_avg_means <- paper_whatYouSaw2 %>%
    filter(paperA_whatYouSaw2 == "recalled_uncert_avg")
    
  recalled_avg_t_stats <- (mutate(paper_psup_ds, recalled_avg = paperA_whatYouSaw2 == "recalled_uncert_avg") %>% 
    t.test(recalled_avg ~ condition, data=.) %>%
      apa_print())$statistic  %>% remove_dollar_signs()
  
  list(recalled_avg_means=recalled_avg_means, recalled_avg_t_stats=recalled_avg_t_stats)
}

plot_psup_game <- function(psup_game) {
  psup_game %>%
    mutate(condition=recode_factor(condition, SE_NO_FEEDBACK="SE Only", SE_POINTS_NO_FEEDBACK="SE + Points")) %>%
    ggplot(aes(x = psup, y = guess, color=condition, fill=condition)) +
      #facet_wrap(~ condition, ncol = 2) +
      geom_point(position = position_jitter(width = 0.15), alpha = 0.3) +
      geom_abline(slope=1, intercept=0, linetype='dashed') +
      geom_smooth(method='loess') +
      theme(legend.position = "top") +
      xlab("True probability\nof superiority") +
      ylab("Estimated probability\nof superiority") +
      scale_y_continuous(label = function(x) paste0(x, "%"))
}

psup_game_tests <- function(psup_game) {
  # preregistered test:
  model <- lmer(unsigned_error ~ (1|assignmentId) + condition + psup, data = psup_game)
  
  trials_lmer_coef <- broom.mixed::tidy(model) %>%
    filter(effect == "fixed" & term=="conditionSE_POINTS_NO_FEEDBACK") %>%
    select(-c(effect, group))
  
  # Extreme responses via t.test
  trials_extreme_means <- psup_game %>%
    mutate(extreme = guess > 90) %>%
      group_by(condition) %>%
      summarize(num_extreme = sum(extreme),
                prop_extreme = num_extreme / n(),
                count=n())
  
  trials_extreme_t_stats <- (psup_game %>%
    mutate(extreme = guess > 90) %>%
    t.test(extreme ~ condition, data=.) %>%
    apa_print())$statistic
  
  list(trials_lmer_coef=trials_lmer_coef,
       trials_extreme_means=trials_extreme_means,
       trials_extreme_t_stats=trials_extreme_t_stats)
}

show_feedback <- function(experiment) {
  table.feedback <- read.delim(here(paste("tidy-data/", experiment, "-tidy-feedback.tsv", sep="")))
  
  table.feedback %>%
    filter(feedback != "") %>%
    select(condition, feedback) %>%
    datatable(
      caption = "Feedback",
      filter = "top",
      rownames = FALSE,
      options = list(autoWidth = TRUE)
    )
}

fit_psup_vs_overall_emm_faculty <- function(background_data, faculty_editorial_data) {
  paper_psup_fac <- faculty_editorial_data %>% filter(!is.na(paperA_superiorityEstimate))
  paper_psup_fac_bg <- merge(
    background_data %>% filter(departmentField != "") %>% select(-c(condition)),
    paper_psup_fac,
    by="assignmentId"
  )
  
  mod.editorial.mediation.bg <- lm(q_overall ~ paperA_superiorityEstimate + condition + departmentField + comfortWithStats + comfortWithData + taughtStats + papersReviewed, paper_psup_fac_bg)
  mod.editorial.mediation.bg
}

fit_psup_vs_overall_emm_datascientists <- function(background_ds, datascientist_editorial_data) {
  paper_psup_ds <- datascientist_editorial_data %>% filter(!is.na(paperA_superiorityEstimate))
  paper_psup_ds_bg <- merge(
    background_ds %>% select(-c(condition, has_any_stats_training)),
    paper_psup_ds,
    by="assignmentId"
  )
  
  mod.editorial.mediation.bg <- lm(q_overall ~ paperA_superiorityEstimate + condition + rctComfort + currentlyDoingResearch + yearsExperience + has_phd + has_read_rct + has_published + has_conducted_rct + has_took_course + has_analyzed_data + has_used_stats_software, paper_psup_ds_bg)
  mod.editorial.mediation.bg
}


plot_psup_vs_overall_emm <- function(fitted.model, editorial_data) {
  paper_psup <- editorial_data %>% filter(!is.na(paperA_superiorityEstimate))
  emm_mediation <- ggemmeans(fitted.model, terms=c("paperA_superiorityEstimate"), interval="confidence", vcov.fun="vcovCR", vcov.type = "HC0")
  
  plot(emm_mediation, ci=TRUE, use.theme=FALSE, colors=hue_pal()(4)) +
    labs(title="", x="Estimated probability of superiority", y="Overall recommendation") +
    geom_jitter(data=paper_psup, aes(x=paperA_superiorityEstimate, y=q_overall), width=0, height=0.2, alpha=0.5) +
    #geom_hline(yintercept=emm_mediation$predicted[1], linetype="dotted") +
    scale_x_continuous(expand=c(0.005, 0), limits=c(50, 100)) +
    theme(plot.margin = unit(c(0,0.5,0.2,0.2), "cm"))
}


plot_implied_auc <- function(implied_auc) {
  #  mutate(truth=ifelse(medication_type == "Blood pressure scenario", 0.722, 0.760))
    ggplot(implied_auc, aes(y=100*auc, x=first_condition, color=first_condition)) +
      geom_jitter(width=0.15) +
      stat_summary(fun = mean, geom = "point", size=1.2) +
      stat_summary(fun.data="mean_se",  fun.args = list(mult=1), 
                   geom="errorbar", color = "black", width=0.1) +
      geom_hline(data=true_effects, aes(yintercept=100*auc), linetype='dashed') +
      facet_wrap(~medication_type) +
      guides(color = "none") +
    coord_cartesian(ylim=c(NA, 100)) +
    labs(x="", y="Implied probability\nof superiority") +
    scale_y_continuous(label = function(x) paste0(x, "%"))
}
