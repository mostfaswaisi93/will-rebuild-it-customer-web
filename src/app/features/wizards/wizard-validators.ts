import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Address } from '@core/models';

/**
 * Validator for an `AddressPicker` control: the picker emits an `Address`
 * object as soon as a governorate is chosen (with an empty district), so a
 * plain `Validators.required` is not enough — both the governorate and the
 * district must be set for the address to count as complete.
 */
export function addressComplete(control: AbstractControl): ValidationErrors | null {
  const value = control.value as Address | null;
  return value && value.governorate && value.district ? null : { required: true };
}

/**
 * Validator for a `PhoneInput` control: the control emits the full
 * `+970XXXXXXXXX` string (or `''` while incomplete). Emptiness is left to
 * `Validators.required`; this only rejects a partially-typed Gaza number.
 */
export function gazaPhone(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string | null) ?? '';
  if (!value) {
    return null;
  }
  return /^\+970\d{9}$/.test(value) ? null : { phone: true };
}
