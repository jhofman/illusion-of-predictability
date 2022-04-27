library(boot)
library(tidyverse)
library(broom)
library(ROCR)
library(effectsize)

theme_set(theme_bw() +
            theme(panel.grid.major=element_blank(), 
                  panel.grid.minor=element_blank()))

bootstrapped_median_ci <- function(df, colname, reps = 1000, conf = 0.95) {
  # extract the requested column as a vector
  x <- pull(df, colname)
  
  # run the bootstrap and rename columns
  result <- data.frame(median = median(x),
                       boot.ci(boot(x, function(y, ndx) { median(y[ndx])}, reps), conf = conf, type = "basic")$basic) %>%
    select(lower = V4, median, upper = V5)
  
  return(result)
}

set.seed(1)
N <- 150
mut <- 9
muc <- 13
sigma <- 4

xc <- rnorm(N, 0, 1)
xc <- (xc - mean(xc)) / sd(xc)
xc <- xc * sigma + muc
xt <- rnorm(N, 0, 1)
xt <- (xt - mean(xt)) / sd(xt)
xt <- xt * sigma + mut
xt <- round(pmin(pmax(xt, 0), 30))
xc <- round(pmin(pmax(xc, 0), 30))

#xt <- round(pmin(pmax(rnorm(N, mut, 4), 0), 30))
#xc <- round(pmin(pmax(rnorm(N, muc, 4), 0), 30))
# center exactly on the desired means
#xt <- xt - mean(xt) + mut
#xc <- xc - mean(xc) + muc

df <- data.frame(id = 1:(2*N),
                 condition = rep(c('Treatment','Control'), each = N),
                 days_to_recovery = c(xt, xc))

dhat <- cohens_d(df$days_to_recovery, df$condition)
print(sprintf("Cohen's D: %g", dhat$Cohens_d))

pred <- prediction(df$days_to_recovery, df$condition == last(df$condition))
perf <- performance(pred, 'auc')
print(sprintf('Probability of superiority: %g', perf@y.values[[1]]))

ggplot(df, aes(x = days_to_recovery, color = condition, fill = condition)) +
  geom_density(alpha = 0.5)

df %>%
  group_by(condition) %>%
  do(bootstrapped_median_ci(., "days_to_recovery", reps = 10000, conf = 0.95))

df %>%
  group_by(condition) %>%
  summarize(mu = mean(days_to_recovery),
            sd = sd(days_to_recovery))

df %>%
  group_by(condition) %>%
  summarize(lower = quantile(days_to_recovery, 0.025),
            upper = quantile(days_to_recovery, 0.975))



########################################
# PLOT FINAL AMOUNTS
########################################

(plot_data <- df %>%
   group_by(condition) %>%
   summarize(count = n(),
             mean_final = mean(days_to_recovery),
             sd_final = sd(days_to_recovery),
             se_final = sd_final / sqrt(n())))

# STANDARD ERRORS
ylim <- c(8, 14)
breaks <- 1:20
ggplot(plot_data, aes(x = condition, y = mean_final)) +
  geom_errorbar(aes(ymin = mean_final - 1.96*se_final,
                    ymax = mean_final + 1.96*se_final),
                width = 0.05) +
  geom_point() +
  labs(x = '',
       y = 'Days to recovery',
       title = 'Results of RCT',
       subtitle = 'Error bars show two standard errors') +
  scale_y_continuous(lim = ylim, breaks = breaks)
ggsave(filename = 'figures/covid_19_se_bars.png', width = 4, height = 4)

# STANDARD DEVIATIONS
ylim <- c(1, 22)
breaks <- seq(ylim[1], ylim[2], by = 4)

ggplot(plot_data, aes(x = condition, y = mean_final)) +
  geom_errorbar(aes(ymin = mean_final - 1.96*sd_final,
                    ymax = mean_final + 1.96*sd_final),
                width = 0.05) +
  geom_point() +
  labs(x = '',
       y = 'Days to recovery',
       title = 'Results of RCT',
       subtitle = 'Error bars show two standard deviations') +
  scale_y_continuous(lim = ylim, breaks = breaks)
  ggsave(filename = 'figures/covid_19_sd_bars.png', width = 4, height = 4)


# STANDARD ERRORS WITH POINTS

# todo: trim to 95% in each condition
ggplot(df, aes(x = condition)) +
  geom_point(aes(y = days_to_recovery), position = position_jitter(width = 0.125), size = 0.5, alpha = 0.15) +
  geom_errorbar(data = plot_data, aes(ymin = mean_final - 1.96*se_final,
                                      ymax = mean_final + 1.96*se_final),
                width = 0.05
                #, color = "blue"
  ) +
  geom_point(data = plot_data, aes(y = mean_final)
             #, color = "blue"
  ) +
  labs(x = '',
       y = 'Days to recovery',
       title = 'Results of RCT',
       subtitle = 'Error bars show two standard errors') +
  scale_y_continuous(lim = ylim, breaks = breaks)
ggsave(filename = 'figures/covid_19_se_bars_with_points.png', width = 4, height = 4)
