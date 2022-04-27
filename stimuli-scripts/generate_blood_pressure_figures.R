library(scales)
library(tidyverse)
library(ROCR)
library(effectsize)

theme_set(theme_bw() +
            theme(panel.grid.major=element_blank(), 
                  panel.grid.minor=element_blank()))

########################################
# CREATE SYNTHETIC DATA
########################################


set.seed(42)

N <- 150
mu0 <- 130
sd0 <- 12

mu1c <- mu0
sd1c <- sd0

mu1t <- 120
sd1t <- sd0

xc <- rnorm(N, 0, 1)
xc <- (xc - mean(xc)) / sd(xc)
xc <- xc * sd1c + mu1c
xt <- rnorm(N, 0, 1)
xt <- (xt - mean(xt)) / sd(xt)
xt <- xt * sd1t + mu1t

df <- data.frame(patient = 1:(2*N),
                 condition = rep(c('Control', 'Treatment'), each = N),
                 initial = rnorm(2*N, mu0, sd0),
                 final = c(xc, xt))

dhat <- cohens_d(df$final, df$condition)
print(sprintf("Cohen's D: %g", dhat$Cohens_d))

pred <- prediction(df$final, df$condition == first(df$condition))
perf <- performance(pred, 'auc')
print(sprintf('Probability of superiority: %g', perf@y.values[[1]]))



########################################
# PLOT FINAL AMOUNTS
########################################

(plot_data <- df %>%
   group_by(condition) %>%
   summarize(count = n(),
             mean_initial = mean(initial),
             sd_initial = sd(initial),
             se_initial = sd_initial / sqrt(n()),
             mean_final = mean(final),
             sd_final = sd(final),
             se_final = sd_final / sqrt(n())))

# STANDARD ERRORS
ylim <- c(115, 135)
breaks <- seq(ylim[1], ylim[2], by = 5)

ggplot(plot_data, aes(x = condition, y = mean_final)) +
  geom_errorbar(aes(ymin = mean_final - 1.96*se_final,
                    ymax = mean_final + 1.96*se_final),
                width = 0.05) +
  geom_point() +
  labs(x = '',
       y = 'Systolic blood pressure (mm Hg)',
       title = 'Results of RCT',
       subtitle = 'Error bars show two standard errors') +
  scale_y_continuous(lim = ylim, breaks = breaks)
ggsave(filename = 'figures/blood_pressure_se_bars.png', width = 4, height = 4)


# STANDARD DEVIATIONS
ylim <- c(90, 160)
breaks <- seq(ylim[1], ylim[2], by = 10)

ggplot(plot_data, aes(x = condition, y = mean_final)) +
  geom_errorbar(aes(ymin = mean_final - 1.96*sd_final,
                    ymax = mean_final + 1.96*sd_final),
                width = 0.05) +
  geom_point() +
  labs(x = '',
       y = 'Systolic blood pressure (mm Hg)',
       title = 'Results of RCT',
       subtitle = 'Error bars show two standard deviations') +
  scale_y_continuous(lim = ylim, breaks = breaks)
ggsave(filename = 'figures/blood_pressure_sd_bars.png', width = 4, height = 4)

# STANDARD ERRORS WITH POINTS

# todo: trim to 95% in each condition
ggplot(df, aes(x = condition)) +
  geom_point(aes(y = final), position = position_jitter(width = 0.125), size = 0.5, alpha = 0.15) +
  geom_errorbar(data = plot_data, aes(ymin = mean_final - 1.96*se_final,
                                      ymax = mean_final + 1.96*se_final),
                width = 0.05
                #, color = "blue"
  ) +
  geom_point(data = plot_data, aes(y = mean_final)
             #, color = "blue"
  ) +
  labs(x = '',
       y = 'Systolic blood pressure (mm Hg)',
       title = 'Results of RCT',
       subtitle = 'Error bars show two standard errors') +
  scale_y_continuous(lim = ylim, breaks = breaks)
ggsave(filename = 'figures/blood_pressure_se_bars_with_points.png', width = 4, height = 4)

########################################
# PLOT CHANGES
########################################


(plot_data <- df %>%
   mutate(change = final - initial) %>%
   group_by(condition) %>%
   summarize(count = n(),
             mean_change = mean(change),
             sd_change = sd(change),
             se_change = sd_change / sqrt(n())))

# STANDARD ERRORS

ggplot(plot_data, aes(x = condition, y = mean_change)) +
  geom_errorbar(aes(ymin = mean_change - 1.96*se_change,
                    ymax = mean_change + 1.96*se_change),
                width = 0.05) +
  geom_point() +
  labs(x = '',
       y = 'Change in systolic blood pressure (mm Hg)',
       title = 'Results of RCT',
       subtitle = 'Error bars show two standard errors'
  ) #+
#scale_y_continuous(lim = c(-70, 30), breaks = seq(-70, 30, by = 10))
ggsave(filename = 'figures/change_se_bars.png', width = 4, height = 4)

# STANDARD DEVIATIONS

ggplot(plot_data, aes(x = condition, y = mean_change)) +
  geom_errorbar(aes(ymin = mean_change - 1.96*sd_change,
                    ymax = mean_change + 1.96*sd_change),
                width = 0.05) +
  geom_point() +
  labs(x = '',
       y = 'Change in systolic blood pressure (mm Hg)',
       title = 'Results of RCT',
       subtitle = 'Error bars show two standard deviations') +
  scale_y_continuous(lim = c(-50, 40), breaks = seq(-50, 40, by = 10))
ggsave(filename = 'figures/change_sd_bars.png', width = 4, height = 4)


# STANDARD ERRORS WITH POINTS

# todo: trim to 95% in each condition
ggplot(df, aes(x = condition)) +
  geom_point(aes(y = final-initial), position = position_jitter(width = 0.125), size = 0.5, alpha = 0.15) +
  geom_errorbar(data = plot_data, aes(ymin = mean_change - 1.96*se_change,
                                      ymax = mean_change + 1.96*se_change),
                width = 0.05
                #, color = "blue"
  ) +
  geom_point(data = plot_data, aes(y = mean_change)
             #, color = "blue"
  ) +
  labs(x = '',
       y = 'Change in systolic blood pressure (mm Hg)',
       title = 'Results of RCT',
       subtitle = 'Error bars show two standard errors') +
  scale_y_continuous(lim = c(-50, 40), breaks = seq(-50, 40, by = 10))
ggsave(filename = 'figures/change_se_bars_with_points.png', width = 4, height = 4)
