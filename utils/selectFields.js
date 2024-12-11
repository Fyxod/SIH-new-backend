export default function getSelectedFields(fields) {
    let selectedFields = "-password";
    for (let field in fields) {
        if (!(fields[field] === "true" || fields[field] === true)) {
            selectedFields += ` -${field}`;
        }
    }

    return selectedFields;
}