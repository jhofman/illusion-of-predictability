export const collectCheckedValuesByCheckboxName = (checkboxName) => {
    let checkboxes = document.querySelectorAll(`input[name=${checkboxName}]`)
    let checkedValues = []
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            checkedValues.push(checkbox.value)
        }
    })

    return checkedValues
}

export const getRadioButtonValue = (radioName) => {
    let radioButtons = document.querySelectorAll(`input[name="${radioName}"]`)
    let checkedValue
    radioButtons.forEach(rb => {
        if (rb.checked) {
            checkedValue = rb.value
        }
    })

    return checkedValue
}
