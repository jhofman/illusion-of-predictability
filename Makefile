all: das-figures faculty-figures medical-figures turker-figures combined-figures

clean:
	rm -f analysis/figures/*.pdf

das-preprocess: analysis/01_preprocess_full_data_scientist_experiment_responses.py raw-data/datascientists.csv
	cd analysis && \
	python3 01_preprocess_full_data_scientist_experiment_responses.py

das-figures: das-preprocess analysis/02_analyze_full_data_scientist_experiment.Rmd tidy-data/datascientists-tidy-editorial.csv
	cd analysis && \
	Rscript -e "rmarkdown::render('02_analyze_full_data_scientist_experiment.Rmd')"

faculty-preprocess: analysis/01_preprocess_faculty_experiment_responses.py raw-data/faculty.csv
	cd analysis && \
	python3 01_preprocess_faculty_experiment_responses.py

faculty-figures: faculty-preprocess analysis/02_analyze_full_faculty_experiment.Rmd tidy-data/faculty-tidy-editorial.csv
	cd analysis && \
	Rscript -e "rmarkdown::render('02_analyze_full_faculty_experiment.Rmd')"

medical-figures: analysis/02_analyze_providers.Rmd raw-data/providers.tsv
	cd analysis && \
	Rscript -e "rmarkdown::render('02_analyze_providers.Rmd')"

turker-figures: analysis/02_analyze_turkers.Rmd raw-data/mturk.tsv
	cd analysis && \
	Rscript -e "rmarkdown::render('02_analyze_turkers.Rmd')"

combined-figures: analysis/03_make_final_figures.Rmd tidy-data/faculty-tidy-editorial.csv tidy-data/datascientists-tidy-editorial.csv raw-data/providers.tsv
	cd analysis && \
		rm -f 02_analyze_*.R && \
		Rscript -e "knitr::purl('02_analyze_providers.Rmd')" && \
		Rscript -e "knitr::purl('02_analyze_turkers.Rmd')" && \
		Rscript -e "rmarkdown::render('03_make_final_figures.Rmd')"
