/// <reference types="jest" />
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import FormField from '../components/ui/form-field';

describe('FormField', () => {
  it('renders the label and placeholder correctly', () => {
    const onChangeText = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      <FormField
        label="Email"
        placeholder="name@example.com"
        value=""
        onChangeText={onChangeText}
      />
    );

    expect(getByText('Email')).toBeTruthy();
    expect(getByPlaceholderText('name@example.com')).toBeTruthy();
  });

  it('fires onChangeText when the user types', () => {
    const onChangeText = jest.fn();

    const { getByLabelText } = render(
      <FormField
        label="Password"
        placeholder="Enter password"
        value=""
        onChangeText={onChangeText}
      />
    );

    fireEvent.changeText(getByLabelText('Password'), 'mypassword123');

    expect(onChangeText).toHaveBeenCalledWith('mypassword123');
  });
});