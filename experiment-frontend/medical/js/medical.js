// turn on/off console logging
var DEBUG_STATE = true;

// subject-level variables as globals
var assignment_id, worker_id, hit_id, submit_to;

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
	validate_forms();

	// create fake assignment id, hit id, and worker id if none provided
	if ($.url().attr('query') == "") {
		logger('creating fake assignment');
		var params = create_test_assignment();
		var query_str = window.location.pathname + '?' + $.param(params);
		window.history.pushState("", "", query_str);
	}

	// parse url parameters
	assignment_id = $.url().param('assignmentId');
	worker_id = $.url().param('workerId');
	hit_id = $.url().param('hitId');
	submit_to = $.url().param('turkSubmitTo');

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

	// hide everything on the page
	hide_all();

	if (assignment_id == 'ASSIGNMENT_ID_NOT_AVAILABLE') {
		$('#preview').show();
		return;
	} else {
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

	log_start_of_experiment();
	
	// show consent form
	$('#consent').show();
	ts_consent_start = getDateTime();
}

function log_start_of_experiment() {
	$.ajax({
		url: "https://mturk-function-app-node.azurewebsites.net/api/mturk-insert-response",
		//contentType: "application/json",
		type: "POST",
		//datatype: "json",
		data: JSON.stringify({
			hitId: hit_id,
			assignmentId: assignment_id,
			workerId: worker_id,
			assignmentId: assignment_id,
			workerId: worker_id,
			hitId: hit_id,
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
	$('#final_submit').hide()
	$('#special_error').hide()
	$('#done').hide()
}


function show_submit_page() {
	$('#final_submit').show()
	$('form#submit_to_turk').attr('action', submit_to + '/mturk/externalSubmit');

	logger('assignment is')
	logger(assignment_id)
	ts_submitted = getDateTime();

	params = {
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
		ts_submitted_: ts_submitted, // DO NOT CHANGE: this will break if you change this to ts_submitted instead of ts_submitted_
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
	logger(params)

	$.each(params, function (name, val) {
		$('form#submit_to_turk').append('<input type=hidden name="' + name + '" value="' + val + '" />');
	});

	$('form#submit_to_turk').submit(function (event) {

		event.preventDefault(); //this will prevent the default submit
		var _this = $(this); //store form so it can be accessed later

		$('#final_submit').slideUp(function () {
			$('#done').show();
		});

		params['feedback'] = $('#feedback').val();

		$.ajax({
			url: "https://mturk-function-app-node.azurewebsites.net/api/mturk-insert-response",
			//contentType: "application/json",
			type: "POST",
			//datatype: "json",
			data: JSON.stringify(params),
			success: function (data) {
				console.log(data);
				_this.unbind('submit').submit(); // continue the submit unbind preventDefault
			},
			error: function (request, error) {
				console.log("Error. Request: " + JSON.stringify(request))
				console.log(error);
			}
		});
		//$.ajax('GET', 'url').then(function (resp) {

		//alert('click ok to make this go away');
		//})

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
		}
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
		//show_next_survey_question()
		$('#first_scenario').show();
	});
}

function submit_first_scenario() {
	$('#first_scenario').slideUp(function () {
		ts_rct_start[condition] = getDateTime();

		html = '';
		file_suffix = '.png';
		html = '<img src="static/' + medication_type + '_';

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
	$('#superiority').slideUp(function () {
		superiority_estimate[condition] = $('#superiority_estimate').val();
		ts_cost_start[condition] = getDateTime();
		$('#cost').show();
	});
}

function submit_cost() {
	$('#rct').slideUp(function () {
		cost_estimate[condition] = $('#cost_estimate').val();
		ts_what_you_saw_start[condition] = getDateTime();

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
		initialize_distbuilders();
		$('#distbuilder').show();
	});
}

function submit_distbuilder() {
	distribution_control[condition] = distbuilder_standard.getDistribution();
	distribution_treatment[condition] = distbuilder_special.getDistribution();
	$('#distbuilder').slideUp(function () {
		ts_second_scenario_start = getDateTime();

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
			ts_final_start = getDateTime();
			show_submit_page()
		}

	});
}

function submit_second_scenario() {
	$('#second_scenario').slideUp(function () {
		submit_first_scenario();
	});
}

/* HELPER FUNCTIONS BELOW */

// generate fake assignment_id, worker_id, and hit_id
function create_test_assignment() {
	var characters = 'ABCDEFGHIJoKLMNOPQRSTUVWXYZ0123456789';
	characters = characters.split('');

	suffix = shuffle(characters).slice(0, 12).join('');

	return {
		assignmentId: 'ASSIGNMENT_' + suffix,
		hitId: 'HIT_' + suffix,
		turkSubmitTo: 'https://workersandbox.mturk.com',
		workerId: 'WORKER_' + suffix
	};
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
