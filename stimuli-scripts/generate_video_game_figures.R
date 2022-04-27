library(foreign)
library(effectsize)
library(ROCR)
library(here)
library(patchwork)
library(tidyverse)
library(dplyr)

here::i_am("scripts/generate_figures.R")

######################################
# Violent video games
# https://www.apa.org/pubs/journals/releases/psp784772.pdf
######################################

# random seed for reproducibility
set.seed(57)

# what we know from the paper
# N <- 210
N <- 800 # Increase N to be more similar to modern sample sizes
cohensD <- 0.31
mut <- 6.81
muc <- 6.65

# implied sd, assuming they're equal in each condition
sd.vg <- (mut - muc)/(cohensD)
# implied se
se.vg <- sd.vg / sqrt(N/2)

# sd's we'll use for treatment and control
# rounded to nearest 100th, and then fudged up and down
# to avoid being exactly equal and looking strange
sigmat <- round(sd.vg * 100) / 100 - 0.01
sigmac <- round(sd.vg * 100) / 100 + 0.01

resampleData = function(sample.size) {
  # now we'll simulate the treatment and control data
  #   first sample from a normal
  #   then standardize to mean 0, sd 1
  #   then rescale to desired mean and sd in each condition
  xc <- rnorm(sample.size/2, 0, 1)
  xc <- (xc - mean(xc)) / sd(xc)
  xc <- xc * sigmac + muc
  xt <- rnorm(sample.size/2, 0, 1)
  xt <- (xt - mean(xt)) / sd(xt)
  xt <- xt * sigmat + mut
  
  # create a "tidy" dataframe with everything in it
  # and order the condition factor so the higher mean "comes first"
  # (this is just a hack for having "Violent games" on the left in the plot)
  df <- data.frame(outcome = c(xt, xc),
                   condition = rep(c('Violent game', 'Non-violent game'), each = sample.size/2)) %>%
    mutate(condition = reorder(condition, -outcome))
}

df <- resampleData(N)

# now check all the values we care about
# first means, sd, and se by condition
summary_stats <- df %>%
  group_by(condition) %>%
  dplyr::summarize(mu = mean(outcome),
            sd = sd(outcome),
            se = sd(outcome) / sqrt(n()))

# and significance test
t.test(outcome ~ condition, data = df)

# next cohen's d
dhat <- cohens_d(outcome ~ condition, data = df)
print(sprintf("Cohen's D: %g", dhat$Cohens_d))

# now probability of superiority
pred <- prediction(df$outcome, df$condition == first(df$condition))
perf <- performance(pred, 'auc')
print(sprintf('Probability of superiority: %g', perf@y.values[[1]]))


make_plot <- function(df, show_points = TRUE) {
  p <- ggplot(df, aes(x=condition, y=outcome))
  
  if (show_points)
    p <- p +
      geom_point(position = position_jitter(width = 0.15), alpha = 0.3, mapping = aes(color=condition)) +
      scale_color_manual(values=c("#af8dc3", "#7fbf7b"))
  
  p <- p +
    stat_summary(fun = mean, geom = "point", size=1.2) +
    stat_summary(fun.data="mean_se",  fun.args = list(mult=1), 
                 geom="errorbar", color = "black", width=0.1) +
    xlab("Condition") +
    ylab("Aggressiveness score") +
    theme_bw() +
    theme(legend.position = "none")
  
  return(p)
}

se_plot <- make_plot(df, F)
se_plot
ggsave(file = here('./data/videogame_se.png'), width = 3, height = 3)

se_points_plot <- make_plot(df, T)
se_points_plot
ggsave(file = here('./data/videogame_points.png'), width = 3, height = 3)

## Bootstrap results

bootstrap_results = c()

for (i in 1:1000) {
  df <- resampleData(N)
  pred <- prediction(df$outcome, df$condition == first(df$condition))
  perf <- performance(pred, 'auc')
  
  bootstrap_results <- c(bootstrap_results, perf@y.values[[1]])
}

quantile(bootstrap_results, probs=c(0.025, 0.975))

######################################
# Generate figures for the tutorial
# Note: these are then post-processed in Keynote
######################################

smallest_df <- rbind(
  df %>% filter(condition == "Violent game") %>% head(50),
  df %>% filter(condition == "Non-violent game") %>% head(50)
)

set.seed(57)

ylim_range_smallest <- c(6.53, 6.95)
ylim_range_big <- c(4.75, 8.5)
shaded_alpha <- 0.1

smallest_se_points_rev <- 
  make_plot(smallest_df, T) +
  labs(x="", y="") + ylim(ylim_range_big) +
  annotate("rect", ymin=min(ylim_range_smallest), ymax=max(ylim_range_smallest), xmin=-Inf, xmax=Inf, alpha=shaded_alpha) +
  geom_hline(yintercept=ylim_range_smallest, linetype="dashed", size=0.2)
  
smallest_se_only_rev <- 
  make_plot(smallest_df, F) +
  labs(x="") + 
  coord_cartesian(ylim = ylim_range_smallest) +
  annotate("rect", ymin=0, ymax=10, xmin=-Inf, xmax=Inf, alpha=shaded_alpha)
    
big_se_points_smallest_rev <- 
  make_plot(df, T) + ylim(ylim_range_big) +
  labs(x="", y="") +
  annotate("rect", ymin=min(ylim_range_smallest), ymax=max(ylim_range_smallest), xmin=-Inf, xmax=Inf, alpha=0.2) +
  geom_hline(yintercept=ylim_range_smallest, linetype="dashed", size=0.2)

big_se_only_smallest_rev <- make_plot(df, F) +
  labs(x="") +
  coord_cartesian(ylim = ylim_range_smallest) +
  annotate("rect", ymin=0, ymax=10, xmin=-Inf, xmax=Inf, alpha=shaded_alpha)

(smallest_se_only_rev | smallest_se_points_rev) / (big_se_only_smallest_rev | big_se_points_smallest_rev)
ggsave(here("analysis/figures/tutorial_figure2_rev.png"), width=6, height=6)

set.seed(57)

smallest_se_points_rev_color2 <- 
  make_plot(smallest_df, T) +
  labs(x="", y="") + ylim(ylim_range_big) +
  annotate("rect", ymin=-Inf, ymax=min(ylim_range_smallest), xmin=-Inf, xmax=Inf, alpha=shaded_alpha) +
  annotate("rect", ymin=max(ylim_range_smallest), ymax=Inf, xmin=-Inf, xmax=Inf, alpha=shaded_alpha) +
  geom_hline(yintercept=ylim_range_smallest, linetype="dashed", size=0.2)
  
smallest_se_only_rev_color2 <- 
  make_plot(smallest_df, F) +
  labs(x="") + 
  coord_cartesian(ylim = ylim_range_smallest) 
    
big_se_points_smallest_rev_color2 <- 
  make_plot(df, T) + ylim(ylim_range_big) +
  labs(x="", y="") +
  annotate("rect", ymin=-Inf, ymax=min(ylim_range_smallest), xmin=-Inf, xmax=Inf, alpha=shaded_alpha) +
  annotate("rect", ymin=max(ylim_range_smallest), ymax=Inf, xmin=-Inf, xmax=Inf, alpha=shaded_alpha) +
  geom_hline(yintercept=ylim_range_smallest, linetype="dashed", size=0.2)

big_se_only_smallest_rev_color2 <- make_plot(df, F) +
  labs(x="") +
  coord_cartesian(ylim = ylim_range_smallest) 

(smallest_se_only_rev_color2 | smallest_se_points_rev_color2) / (big_se_only_smallest_rev_color2 | big_se_points_smallest_rev_color2)
ggsave(here("analysis/figures/tutorial_figure2_rev_color2.png"), width=6, height=6)

small_sd_only_rect <- smallest_df %>%
  group_by(condition) %>%
  dplyr::summarize(outcome_mean = mean(outcome),
                   outcome_sd = sd(outcome)) %>%
  ggplot(aes(x=condition, y=outcome_mean, ymin=outcome_mean - outcome_sd, ymax=outcome_mean + outcome_sd)) +
    geom_point(size=1.2) +
    geom_errorbar(color='black', width=0.1) +
    xlab("") +
    ylab("") +
    theme_bw() +
    theme(legend.position = "none") +
    coord_cartesian(ylim = ylim_range_big) +
  annotate("rect", ymin=-Inf, ymax=min(ylim_range_smallest), xmin=-Inf, xmax=Inf, alpha=shaded_alpha) +
  annotate("rect", ymin=max(ylim_range_smallest), ymax=Inf, xmin=-Inf, xmax=Inf, alpha=shaded_alpha) +
  geom_hline(yintercept=ylim_range_smallest, linetype="dashed", size=0.2) 

big_sd_only_rect <- df %>%
  group_by(condition) %>%
  dplyr::summarize(outcome_mean = mean(outcome),
                   outcome_sd = sd(outcome)) %>%
  ggplot(aes(x=condition, y=outcome_mean, ymin=outcome_mean - outcome_sd, ymax=outcome_mean + outcome_sd)) +
    geom_point(size=1.2) +
    geom_errorbar(color='black', width=0.1) +
    xlab("") +
    ylab("") +
    theme_bw() +
    theme(legend.position = "none") +
    coord_cartesian(ylim = ylim_range_big) +
  annotate("rect", ymin=-Inf, ymax=min(ylim_range_smallest), xmin=-Inf, xmax=Inf, alpha=shaded_alpha) +
  annotate("rect", ymin=max(ylim_range_smallest), ymax=Inf, xmin=-Inf, xmax=Inf, alpha=shaded_alpha) +
  geom_hline(yintercept=ylim_range_smallest, linetype="dashed", size=0.2)
  
(smallest_se_only_rev_color2 | smallest_se_points_rev_color2 | small_sd_only_rect) /
  (big_se_only_smallest_rev_color2 | big_se_points_smallest_rev_color2 | big_sd_only_rect)
ggsave(here("analysis/figures/tutorial_figure_3col_funnel.png"), width=8, height=6)
ggsave(here("analysis/figures/tutorial_figure_3col_funnel.pdf"), width=8, height=6)

set.seed(57)

smallest_se_only_biglim <- 
  make_plot(smallest_df, F) +
  labs(x="") + 
  coord_cartesian(ylim = ylim_range_big) 

big_se_only_biglim <- 
  make_plot(df, F) +
  labs(x="") + 
  coord_cartesian(ylim = ylim_range_big) 

small_sd_only <- smallest_df %>%
  group_by(condition) %>%
  dplyr::summarize(outcome_mean = mean(outcome),
                   outcome_sd = sd(outcome)) %>%
  ggplot(aes(x=condition, y=outcome_mean, ymin=outcome_mean - outcome_sd, ymax=outcome_mean + outcome_sd)) +
    geom_point(size=1.2) +
    geom_errorbar(color='black', width=0.1) +
    xlab("") +
    ylab("") +
    theme_bw() +
    theme(legend.position = "none") +
    coord_cartesian(ylim = ylim_range_big)

big_sd_only <- df %>%
  group_by(condition) %>%
  dplyr::summarize(outcome_mean = mean(outcome),
                   outcome_sd = sd(outcome)) %>%
  ggplot(aes(x=condition, y=outcome_mean, ymin=outcome_mean - outcome_sd, ymax=outcome_mean + outcome_sd)) +
    geom_point(size=1.2) +
    geom_errorbar(color='black', width=0.1) +
    xlab("") +
    ylab("") +
    theme_bw() +
    theme(legend.position = "none") +
    coord_cartesian(ylim = ylim_range_big)
  
smallest_se_points_norect <- 
  make_plot(smallest_df, T) +
  labs(x="", y="") + ylim(ylim_range_big)
  
big_se_points_norect <- 
  make_plot(df, T) + ylim(ylim_range_big) +
  labs(x="", y="")

(smallest_se_only_biglim | small_sd_only | smallest_se_points_norect) /
  (big_se_only_biglim | big_sd_only | big_se_points_norect)
ggsave(here("analysis/figures/tutorial_figure_3col_samelim.png"), width=8, height=6)
ggsave(here("analysis/figures/tutorial_figure_3col_samelim.pdf"), width=8, height=6)

(smallest_se_only_rev_color2 | small_sd_only | smallest_se_points_norect) /
  (big_se_only_smallest_rev_color2 | big_sd_only | big_se_points_norect)
ggsave(here("analysis/figures/tutorial_figure_3col_difflim.png"), width=8, height=6)
ggsave(here("analysis/figures/tutorial_figure_3col_difflim.pdf"), width=8, height=6)
