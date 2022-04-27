function submit_consent() {
	var checkbox = document.querySelector("#consent_checkbox")
	if (!checkbox.checked) {
		document.querySelector("#error").style.display = "block"
		return
	}

	var pageUrl = new URL(window.location.href)
	window.location.assign("psup.html" + pageUrl.search )
}