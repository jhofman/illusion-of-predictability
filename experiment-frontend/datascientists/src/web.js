import _ from "lodash"

export const submitToMturk = async (mturkParams, results) => {
	let submitToTurkForm = document.querySelector("#submit_to_turk")

	submitToTurkForm.setAttribute('action', mturkParams.turkSubmitTo + '/mturk/externalSubmit');

	let newInput = document.createElement('input')
	newInput.setAttribute("type", "hidden")
	newInput.setAttribute("name", "submission")
	newInput.setAttribute("value", JSON.stringify(results))
	submitToTurkForm.append(newInput)

	_.each(mturkParams, function (val, name) {
		let newInput = document.createElement('input')
		newInput.setAttribute("type", "hidden")
		newInput.setAttribute("name", name)
		newInput.setAttribute("value", val)
		submitToTurkForm.append(newInput)
	});

	submitToTurkForm.submit()
}

export const logToAzure = async (data) => {
	const response = await fetch("https://mturk-function-app-node.azurewebsites.net/api/mturk-insert-response", {
		method: "POST",
		body: JSON.stringify(data)
	})

	return response.json()
}