import values from 'object.values';

const fieldValuesToArray = (valuesString) => valuesString.split(/\s*,\s*/);

const areCastedStringsEqual = (firstVal) => (secondVal) => String(firstVal) === String(secondVal);

const doesArrayIncludeEqualString = (strArr) => (str) =>
  strArr.some((strArrItem) => areCastedStringsEqual(strArrItem)(str));

const parseFieldValue = (isLocalized) => (locale) => (fieldValue) =>
  isLocalized ? fieldValue[locale] : fieldValue;

const toggleDatoField = (datoToggleFieldMethod) => (fieldPath) => (shouldShow) => (invert) => {
  datoToggleFieldMethod(fieldPath, invert ? !shouldShow : shouldShow);
  return Promise.resolve();
};

window.DatoCmsPlugin.init((plugin) => {
  const { instance } = plugin.parameters;
  const { invert, masterFieldKey, masterFieldValue } = instance;
  const expectedMasterFieldValues = fieldValuesToArray(masterFieldValue);
  const isMasterFieldValueExpected = doesArrayIncludeEqualString(expectedMasterFieldValues);

  const masterField = values(plugin.fields).find(
    ({ attributes }) => attributes.api_key === masterFieldKey,
  );

  if (!masterField) {
    console.error(`Plugin error: The field "${masterFieldKey}" does not exist`);
    return;
  }

  const toggleSelectedDatoField = toggleDatoField(plugin.toggleField)(plugin.fieldPath)(invert);
  const parseTranslatedFieldValue = parseFieldValue(masterField.attributes.localized)(
    plugin.locale,
  );
  const currentMasterFieldValue = plugin.getFieldValue(masterFieldKey);
  const shouldToggleField = isMasterFieldValueExpected(
    parseTranslatedFieldValue(currentMasterFieldValue),
  );

  toggleSelectedDatoField(shouldToggleField);

  plugin.addFieldChangeListener(masterFieldKey, (nextMasterFieldValue) => {
    const shouldToggleNextField = isMasterFieldValueExpected(
      parseTranslatedFieldValue(nextMasterFieldValue),
    );

    toggleSelectedDatoField(shouldToggleNextField).then(
      plugin.notice('Changes will be visible upon view refresh'),
    );
  });
});
