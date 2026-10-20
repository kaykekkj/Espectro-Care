const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../assets/js/form-utils.js'), 'utf8'), context);
const { isValidCpf } = context.window.EspectroCareForms;
test('aceita dígitos verificadores válidos com e sem máscara', () => {
    for (const value of ['52998224725', '529.982.247-25', '11144477735', '12345678909']) assert.equal(isValidCpf(value), true);
});
test('rejeita dígitos errados, repetidos, caracteres e comprimento incorretos', () => {
    for (const value of ['', null, '11111111111', '00000000000', '52998224724', '12345678900', '5299822472', '529982247251', 'x52998224725']) assert.equal(isValidCpf(value), false);
});
