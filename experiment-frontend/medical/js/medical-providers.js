// turn on/off console logging
var DEBUG_STATE = true;

// subject-level variables as globals
var STUDY_ID = "medical-effects-with-providers";
var HIT_ID = "medical-effects-with-providers-test";
var assignment_id, worker_id, hit_id, submit_to;

var cloudflare_str;
var previously_attempted;

// treatment variables
var medication_type; // blood_pressure or covid_19
var condition; //1 - SD, 2 - SE, 3 - SE WITH POINTS
var SD_CONDITION = 'sd';
var SE_CONDITION = 'se';
var SE_POINTS_CONDITION = 'se_points';
var distbuilder_order; // control_first or treatment_first
var recall_answer_order; // recalled_se_first or recalled_sd_first
var show_means_distbuilder = true; // hard coded to true

// dependent variables
var first_condition;
var superiority_estimate = {};
var cost_estimate = {};
var what_you_saw = {};
var distribution_control = {};
var distribution_treatment = {};
var distbuilder_bins;

// variables for timestamps
var ts_consent_start;
var ts_first_scenario_start;
var ts_rct_start = {};
var ts_cost_start = {};
var ts_what_you_saw_start = {};
var ts_distbuilder_start = {};
var ts_second_scenario_start;

// start with first pass
var pass = 1;

// variables for the distribution builders
var distbuilder_standard, distbuilder_special;

function main() {
    /*
	if (window.document.documentMode) {
		$('#using_ie').show();
	} else {
		$('#consent_form').show();
	}
	*/
    
	validate_forms();

	// hide everything on the page
	hide_all();

	// show the consent form
	$('#consent').show();
        $('#consent_form').show();
	ts_consent_start = getDateTime();

	// grab HIT ID from url
	// if defined, use it to override default value
	hit_id = $.url().param('hitId');
	if (typeof(hit_id) === "undefined")
		hit_id = HIT_ID;

	// create worker id from browser fingerprint
	// and random assignment id
	// this will call assign_experimental_conditions() when done
	logger('creating assignment');
	create_assignment();
}

function assign_experimental_conditions() {
	// grab viz medication_type from url param
	medication_type = $.url().param('medication_type');

	// grab viz condition from url param
	condition = $.url().param('condition');

	// grab set of viz conditions from url param
	condition_set = $.url().param('condition_set');

	// grab the order in which to show the distribution builder from url param
	distbuilder_order = $.url().param('distbuilder_order');

	// grab the order in which to show the responses for the recall question
	recall_answer_order = $.url().param('recall_answer_order');

	//assign medication type
	if (typeof (medication_type) == "undefined") {
		logger('randomizing medication type');
		var unif4 = Math.random();
		if (unif4 < 1 / 2) {
			medication_type = 'blood_pressure';
		} else {
			medication_type = 'covid_19';
		}
	}

	//assign treatment variables
	if (typeof (condition) == "undefined") {
		logger('randomizing sd vs. se condition');

		// use 1 and 2 as default conditions
		if (typeof (condition_set) === "undefined") {
			condition_set = SD_CONDITION + "," + SE_CONDITION;
		}

		// convert comma separated string to array
		condition_set = condition_set.split(',');
		logger(condition_set);
		ndx = getRandomInt(0, condition_set.length - 1);
		condition = condition_set[ndx];
	}

	// convert old numbered treatments to new readable versions
	if (condition == 1)
		condition = SD_CONDITION;
	if (condition == 2)
		condition = SE_CONDITION;

	if (typeof (distbuilder_order) == "undefined") {
		logger('randomizing order of distribution builder pages');
		var unif4 = Math.random();
		if (unif4 < 1 / 2) {
			distbuilder_order = 'control_first';
		} else {
			distbuilder_order = 'treatment_first';
		}
	}

	if (typeof (recall_answer_order) == "undefined") {
		logger('randomizing order of answers to recall questions');
		var unif4 = Math.random();
		if (unif4 < 1 / 2) {
			recall_answer_order = 'recalled_se_first';
		} else {
			recall_answer_order = 'recalled_sd_first';
		}
	}

	// record what the first condition in counterbalancing is
	first_condition = condition;

	logger(medication_type);
	logger(condition);
	logger(distbuilder_order);
	logger(recall_answer_order);

	// remove other medication type from html
	if (medication_type == "blood_pressure")
		$('.covid_19').remove();
	else if (medication_type == "covid_19")
		$('.blood_pressure').remove();
	else {
		console.log('invalid medication type');
		return -1;
	}
	
}

function log_start_of_experiment() {
	$.ajax({
		url: "https://mturk-function-app-node.azurewebsites.net/api/mturk-insert-response",
		//contentType: "application/json",
		type: "POST",
		//datatype: "json",
		data: JSON.stringify({
			cloudflare_str: cloudflare_str,
			study_id : STUDY_ID,
			hitId: hit_id,
			assignmentId: assignment_id,
			workerId: worker_id,
			medication_type: medication_type,
			first_condition: first_condition,
			distbuilder_order: distbuilder_order,
			recall_answer_order: recall_answer_order,
			ts_start: getDateTime()
		}),
		success: function (data) {
			console.log(data);
		},
		error: function (request, error) {
			console.log("Error. Request: " + JSON.stringify(request))
			console.log(error);
		}
	});

}

function log_timestamp_to_azure(ts_name) {
	var params = {
		previously_attempted: previously_attempted,
		study_id: STUDY_ID,
		hitId: hit_id,
		assignmentId: assignment_id,
		workerId: worker_id,
		medication_type: medication_type,
		first_condition: first_condition,
		distbuilder_order: distbuilder_order,
		recall_answer_order: recall_answer_order,
	};
  
	params[ts_name] = getDateTime();
  
	  $.ajax({
		  url: "https://mturk-function-app-node.azurewebsites.net/api/mturk-insert-response",
		  //contentType: "application/json",
		  type: "POST",
		  //datatype: "json",
		  data: JSON.stringify(params),
		  success: function (data) {
			  console.log(data);
		  },
		  error: function (request, error) {
			  console.log("Error. Request: " + JSON.stringify(request))
			  console.log(error);
		  }
	  });
  
  }

// get random integer in range (inclusive)
// stolen from https://stackoverflow.com/a/1527820
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// hides all divs
function hide_all() {
	$('#preview').hide();
	$('#consent').hide();
	$('#first_scenario').hide()
	$('#rct').hide()
	$('#superiority').hide()
	$('#what_you_saw').hide()
	$('#what_you_saw_error').hide()
	$('#cost').hide()
	$('#cost_error').hide()
	$('#distbuilder').hide()
	$('#second_scenario').hide()
	$('#free_response').hide()
	$('#background_survey').hide()
	$('#experience').hide()
	$('#special_error').hide()
	$('#done').hide()
}


function show_free_response_page() {
	$('#free_response').show()
	//$('form#submit_to_turk').attr('action', submit_to + '/mturk/externalSubmit');

	logger('assignment is')
	logger(assignment_id)
	ts_free_response_start = getDateTime();
	log_timestamp_to_azure('ts_free_response_start')
}

function submit_free_response() {

	$('#free_response').slideUp(function () {
		$('#all_past_activities_checkbox_read_rct').on('click', function () {
			if ($(this).is(':checked')) {
				$('#read_rct_years_wrapper').show();
			} else {
				$('#read_rct_years_wrapper').hide();
			}
		});


		$('#background_survey').show();
	});

	$('#all_past_activities_checkbox_changed_based_on_rct').on('click', function () {
		if ($(this).is(':checked')) {
			$('#changed_based_on_rct_years_wrapper').show();
		} else {
			$('#changed_based_on_rct_years_wrapper').hide();
		}
	});

	$('#all_past_activities_checkbox_published').on('click', function () {
		if ($(this).is(':checked')) {
			$('#published_years_wrapper').show();
		} else {
			$('#published_years_wrapper').hide();
		}
	});

	$('#all_past_activities_checkbox_conducted_rct').on('click', function () {
		if ($(this).is(':checked')) {
			$('#conducted_rct_years_wrapper').show();
		} else {
			$('#conducted_rct_years_wrapper').hide();
		}
	});

	$('#all_past_activities_checkbox_took_course').on('click', function () {
		if ($(this).is(':checked')) {
			$('#took_course_years_wrapper').show();
		} else {
			$('#took_course_years_wrapper').hide();
		}
	});

	$('#all_past_activities_checkbox_analyzed_data').on('click', function () {
		if ($(this).is(':checked')) {
			$('#analyzed_data_years_wrapper').show();
		} else {
			$('#analyzed_data_years_wrapper').hide();
		}
	});

	$('#all_past_activities_checkbox_used_stats_software').on('click', function () {
		if ($(this).is(':checked')) {
			$('#used_stats_software_years_wrapper').show();
		} else {
			$('#used_stats_software_years_wrapper').hide();
		}
	});

	ts_background_survey_start = getDateTime();
	log_timestamp_to_azure('ts_background_survey_start')

	params = {
		study_id: STUDY_ID,
		assignmentId: assignment_id,
		workerId: worker_id,
		hitId: hit_id,
		medication_type: medication_type,
		first_condition: first_condition,
		distbuilder_order: distbuilder_order,
		recall_answer_order: recall_answer_order,
		ts_consent_start: ts_consent_start,
		ts_first_scenario_start: ts_first_scenario_start,
		ts_rct_start_sd: ts_rct_start[SD_CONDITION],
		ts_rct_start_se: ts_rct_start[SE_CONDITION],
		ts_cost_start_sd: ts_cost_start[SD_CONDITION],
		ts_cost_start_se: ts_cost_start[SE_CONDITION],
		ts_what_you_saw_start_sd: ts_what_you_saw_start[SD_CONDITION],
		ts_what_you_saw_start_se: ts_what_you_saw_start[SE_CONDITION],
		ts_distbuilder_start_sd: ts_distbuilder_start[SD_CONDITION],
		ts_distbuilder_start_se: ts_distbuilder_start[SE_CONDITION],
		ts_free_response_start: ts_free_response_start,
		ts_background_survey_start: ts_background_survey_start,
		// NOTE: if mturk, would need ts_submitted_ (with the underscore) for submission to work, but dropping here
		superiority_estimate_sd: superiority_estimate[SD_CONDITION],
		superiority_estimate_se: superiority_estimate[SE_CONDITION],
		cost_estimate_sd: cost_estimate[SD_CONDITION],
		cost_estimate_se: cost_estimate[SE_CONDITION],
		what_you_saw_sd: what_you_saw[SD_CONDITION],
		what_you_saw_se: what_you_saw[SE_CONDITION],
		distbuilder_bins: distbuilder_bins,
		distbuilder_control_sd: distribution_control[SD_CONDITION],
		distbuilder_control_se: distribution_control[SE_CONDITION],
		distbuilder_treatment_sd: distribution_treatment[SD_CONDITION],
		distbuilder_treatment_se: distribution_treatment[SE_CONDITION],
	};

	params['feedback'] = $('#feedback').val();

	logger(params)

	// log data to azure
	$.ajax({
		url: "https://mturk-function-app-node.azurewebsites.net/api/mturk-insert-response",
		//contentType: "application/json",
		type: "POST",
		//datatype: "json",
		data: JSON.stringify(params),
		success: function (data) {
			console.log(data);
		},
		error: function (request, error) {
			console.log("Error. Request: " + JSON.stringify(request))
			console.log(error);
		}
	});

}

function get_all_checkbox(input_name) {
	var selected = [];
	
	$.each($('input[name="' + input_name + '"]:checked'), function() {
		selected.push($(this).val())
	});

	return selected;
}

function get_all_past_activity_years() {
	var selected = [];
	
	$.each($('input[type="number"].years'), function() {
		if ($(this).val() != "")
			selected.push($(this).val())
	});

	return selected;
}

function get_radio(input_name) {
	var selected = $('input[name="' + input_name + '"]:checked').val();

	if (typeof(selected) === "undefined")
		return '';
	else
		return selected;
}

function submit_background_survey() {
	$('#background_survey').slideUp(function () {
		$('#done').show();
	});

	ts_final_submit = getDateTime();
	//log_timestamp_to_azure('ts_final_submit')

	survey = {
		study_id: STUDY_ID,
		assignmentId: assignment_id,
		workerId: worker_id,
		hitId: hit_id,
		ts_final_submit: ts_final_submit,
		medication_type: medication_type,
		first_condition: first_condition,
		distbuilder_order: distbuilder_order,
		recall_answer_order: recall_answer_order,
		stats_training: get_all_checkbox('stats_training_checkbox').join(','),
		comfort_with_rcts: get_radio('comfort_with_rcts_radio'),
		//recent_activities: get_all_checkbox('recent_activities_checkbox').join(','),
		all_past_activities: get_all_checkbox('all_past_activities_checkbox').join(','),
		all_past_activityes_years: get_all_past_activity_years().join(','),
		read_rct_years: $('#read_rct_years').val(),
		changed_based_on_rct_years: $('#changed_based_on_rct_years').val(),
		published_years: $('#published_years').val(),
		conducted_rct_years: $('#conducted_rct_years').val(),
		took_course_years: $('#took_course_years').val(),
		analyzed_data_years: $('#analyzed_data_years').val(),
		used_stats_software_years: $('#used_stats_software_years').val(),
		current_research: get_radio('current_research_radio'),
		position: get_radio('position_radio'),
		years_experience: get_radio('years_experience_radio') //,
		//email: $('#email').val()
	};

	$.ajax({
		url: "https://mturk-function-app-node.azurewebsites.net/api/mturk-insert-response",
		//contentType: "application/json",
		type: "POST",
		//datatype: "json",
		data: JSON.stringify(survey),
		success: function (data) {
			console.log(data);
			$('#final_thanks').html('All done, thanks for your participation!')
			$('#spinning_ring').
				attr('class', '').
				html('If you have any questions about this study or would like to see the results when they are ready, please email decisionresearchlab@outlook.com referencing the following information:<br/><br/>participant id: ' + worker_id + '<br/>survey id: ' + assignment_id);

		},
		error: function (request, error) {
			console.log("Error. Request: " + JSON.stringify(request))
			console.log(error);
			$('#final_thanks').html('Thanks for your participation!<br/><br/>Unfortunately we had an issue recording your responses.')
			$('#spinning_ring').
				attr('class', '').
				html('Please email decisionresearchlab@outlook.com referencing the following information and we will look into the issue:<br/><br/>participant id: ' + worker_id + '<br/>survey id: ' + assignment_id);
		}
	});
}

function validate_forms() {
	// set error message placement
	$.validator.setDefaults({
		errorPlacement: function (error, element) {
			if (element.next().prop('tagName') == 'SELECT')
				error.insertAfter(element.next());
			else if (element.attr('type') === 'radio')
				error.appendTo(element.parent());
			//else if (element.attr("type") == "checkbox")
			//	error.insertBefore(element);
			else
				error.insertBefore(element);
			//error.insertAfter(element);
		}
	});

	// adapt "min" method to work for numbers with commas in them
	// http://blog.rebuildall.net/2011/03/02/jQuery_validate_and_the_comma_decimal_separator
	$.validator.methods.min = function (a, b, c) {
		var without_commas = a.replaceAll(",", "");
		return this.optional(b) || without_commas >= c
	}


	$('#consent_form').validate({
		rules: {
			consent_checkbox: {
				required: true
			}
		},
		errorPlacement: function (error, element) {
			error.appendTo($("#previously_attempted_error"));
			$("#previously_attempted_error").show();
		},
	});

	$('#first_scenario_form').validate({
		rules: {
			first_scenario_checkbox: {
				required: true
			}
		}
	});

	$('#superiority_form').validate({
		rules: {
			superiority_estimate: {
				required: true,
				number: true,
				range: [50, 100]
			}
		}
	});

	$('#cost_form').validate({
		rules: {
			cost_estimate: {
				required: true,
				//pattern: /^[0-9,.]/,
				//number: true,
				min: 0
			}
		}
	});

	$('#second_scenario_form').validate({
		rules: {
			second_scenario_checkbox: {
				required: true
			}
		}
	});

	// TODO: get validation working here
	$('#what_you_saw_form').validate({
		rules: {
			what_you_saw_radio: {
				required: true
			}
		},
		errorPlacement: function (error, element) {
			error.appendTo($("#what_you_saw_error"));
			$("#what_you_saw_error").show();
		},
	});

}


function initialize_distbuilders() {
	var nRows = 25;
	var nBalls = 100;
	var labels = [];

	var minVal, maxVal, step;

	// For small and large effect size
	if (medication_type == "blood_pressure") {
		minVal = 85;
		maxVal = 165;
		step = 5;
	} else if (medication_type == "covid_19") {
		minVal = 0;
		maxVal = 26;
		step = 2; //1
	}

	var nBuckets = (maxVal - minVal) / step
	var labels = []
	for (var x = minVal; x < maxVal; x += step) {
		if (step > 1)
			labels.push(x + "\nto\n" + (x + step - 1))
		else
			labels.push(x)
	}
	distbuilder_bins = labels;

	distbuilder_special = new DistributionBuilder({
		nRows: nRows,
		nBuckets: nBuckets,
		minVal: minVal,
		maxVal: maxVal,
		nBalls: nBalls,
		onChange: function () {
			var remainingballs = this.getRemainingBalls();
			$('#special-numleft').text("You have " + remainingballs + " patients left to place.");
			if (remainingballs == 0) {
				$('#special-numleft').css("font-weight", "bold")
			} else {
				$('#special-numleft').css("font-weight", "normal")
			}
		}
	});
	distbuilder_special.render("distbuilder-special");
	distbuilder_special.labelize({ labels: labels });
	distbuilder_standard = new DistributionBuilder({
		nRows: nRows,
		nBuckets: nBuckets,
		minVal: minVal,
		maxVal: maxVal,
		nBalls: nBalls,
		onChange: function () {
			var remainingballs = this.getRemainingBalls();
			$('#standard-numleft').text("You have " + remainingballs + " patients left to place.");
			if (remainingballs == 0) {
				$('#standard-numleft').css("font-weight", "bold")
			} else {
				$('#standard-numleft').css("font-weight", "normal")
			}
		}
	});
	distbuilder_standard.render("distbuilder-standard");
	distbuilder_standard.labelize({ labels: labels });
	$('#distbuilder-special').addClass('distbuilderspecial')
	if (!show_means_distbuilder) {
		console.log("hide means")
		$('.distbuilder_mean').hide()
	} else {
		$('.distbuilder_mean').show()
	}
}

function validate_distbuilder() {
	standard_correct = distbuilder_standard.isComplete();
	special_correct = distbuilder_special.isComplete();
	if (!standard_correct) {
		document.getElementById("distbuilder-standard-error").innerHTML = "<b>Please enter values for all 100 patients.</b>";
		$('#distbuilder-standard-error').show()
	}
	else {
		$('#distbuilder-standard-error').hide()
	}
	if (!special_correct) {
		document.getElementById("distbuilder-special-error").innerHTML = "<b>Please enter values for all 100 patients.</b>";
		$('#distbuilder-special-error').show()
	}
	else {
		$('#distbuilder-special-error').hide()
	}
	return standard_correct && special_correct;
}

function submit_consent() {
	$('#consent').slideUp(function () {
		ts_first_scenario_start = getDateTime();
		previously_attempted = $("input[name='previously_attempted']:checked").val();
		log_timestamp_to_azure('ts_first_scenario_start')
		//show_next_survey_question()
		$('#first_scenario').show();
	});
}

function submit_first_scenario() {
	$('#first_scenario').slideUp(function () {
		ts_rct_start[condition] = getDateTime();
		log_timestamp_to_azure('ts_rct_start_' + condition);

		html = '';
		file_suffix = '.png';
		html = '<img src="../static/' + medication_type + '_';

		if (condition == SD_CONDITION) {
			html += 'sd_bars';
			$('#error_bar_description').html('The <b>error bars in the figure show two standard deviations above and below the average in each group</b>. Predictive intervals like these are constructed such that they should, in the long run, contain outcomes for 95% of similar patients in future studies.');
		}
		else if (condition == SE_CONDITION) {
			html += 'se_bars'
			$('#error_bar_description').html('The <b>error bars in the figure show two standard errors above and below the average in each group</b>. Confidence intervals like these are constructed such that 95% percent of them should, in the long run, contain the true average for similar patients in future studies.');
		}
		else if (condition == SE_POINTS_CONDITION) {
			html += 'se_bars_with_points'
		}

		html += file_suffix + '" height="400" width="400">'
		$('#graph').html(html)

		$('#rct').show();
		$('#superiority').show();
	});
}

function submit_superiority() {
	$('#superiority').slideUp(800, function () {
		superiority_estimate[condition] = $('#superiority_estimate').val();
		ts_cost_start[condition] = getDateTime();
		log_timestamp_to_azure('ts_cost_start_' + condition);
		$('#cost').slideDown(800);
	});
}

function submit_cost() {
	$('#rct').slideUp(function () {
		cost_estimate[condition] = $('#cost_estimate').val();
		ts_what_you_saw_start[condition] = getDateTime();
		log_timestamp_to_azure('ts_what_you_saw_start_' + condition);

		if (recall_answer_order == "recalled_sd_first")
			$('#recalled-sd-wrapper').insertBefore('#recalled-se-wrapper');

		$('#what_you_saw').show();
	});
}

function submit_what_you_saw() {
	$('#what_you_saw').slideUp(function () {
		what_you_saw[condition] = $("input[name='what_you_saw_radio']:checked").val();

		if (distbuilder_order == "treatment_first")
			$('#distbuilder-special-wrapper').insertBefore('#distbuilder-standard-wrapper');

		ts_distbuilder_start[condition] = getDateTime();
		log_timestamp_to_azure('ts_distbuilder_start_' + condition);
		initialize_distbuilders();
		$('#distbuilder').show();
	});
}

function submit_distbuilder() {
	distribution_control[condition] = distbuilder_standard.getDistribution();
	distribution_treatment[condition] = distbuilder_special.getDistribution();
	$('#distbuilder').slideUp(function () {
		ts_second_scenario_start = getDateTime();
		log_timestamp_to_azure('ts_second_scenario_start');

		if (condition == SD_CONDITION) {
			$('#first_condition_bars').html('standard deviations');
			$('#second_condition_bars').html('standard errors');
		} else if (condition == SE_CONDITION) {
			$('#first_condition_bars').html('standard errors');
			$('#second_condition_bars').html('standard deviations');
		}

		if (pass == 1) {
			pass = 2;
			first_condition = condition;
			if (condition == SD_CONDITION)
				condition = SE_CONDITION;
			else
				condition = SD_CONDITION;
			second_condition = condition;

			$('#payment_slider').hide();
			$('#superiority').show();
			$('#cost').hide();
			$('#superiority_estimate').val("");
			$('#cost_estimate').val("");
			$('input[name="what_you_saw_radio"]').attr('checked', false);
			$('#distbuilder-standard').html("")
			$('#distbuilder-special').html("")

			$('#second_scenario').show();
		} else {
			show_free_response_page();
		}

	});
}

function submit_second_scenario() {
	$('#second_scenario').slideUp(function () {
		submit_first_scenario();
	});
}

/* HELPER FUNCTIONS BELOW */

function create_assignment() {
	var guid = function () {

		var nav = window.navigator;
		var screen = window.screen;
		var guid = nav.mimeTypes.length;
		guid += nav.userAgent.replace(/\D+/g, '');
		guid += nav.plugins.length;
		guid += screen.height || '';
		guid += screen.width || '';
		guid += screen.pixelDepth || '';

		return guid;
	};

	worker_id = guid();

	var characters = 'ABCDEFGHIJoKLMNOPQRSTUVWXYZ0123456789';
	characters = characters.split('');

	assignment_id = shuffle(characters).slice(0, 12).join('');

	params = {
		assignmentId: assignment_id,
		hitId: hit_id,
		workerId: worker_id
	};

	var query_str = window.location.pathname + '?' + $.param(params);
	window.history.pushState("", "", query_str);

	assign_experimental_conditions();

	$.get('https://www.cloudflare.com/cdn-cgi/trace', function(data) {
		cloudflare_str = data;
		log_start_of_experiment();
	})

}

function logger(msg) {
	if (DEBUG_STATE)
		console.log(msg);
}

// http://stackoverflow.com/a/19176102/76259
function getDateTime() {
	var now = new Date();
	var year = now.getFullYear();
	var month = now.getMonth() + 1;
	var day = now.getDate();
	var hour = now.getHours();
	var minute = now.getMinutes();
	var second = now.getSeconds();
	if (month.toString().length == 1) {
		var month = '0' + month;
	}
	if (day.toString().length == 1) {
		var day = '0' + day;
	}
	if (hour.toString().length == 1) {
		var hour = '0' + hour;
	}
	if (minute.toString().length == 1) {
		var minute = '0' + minute;
	}
	if (second.toString().length == 1) {
		var second = '0' + second;
	}
	var dateTime = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
	return dateTime;
}

function shuffle(n) { for (var t, e, r = n.length; r;)e = 0 | Math.random() * r--, t = n[r], n[r] = n[e], n[e] = t; return n }
