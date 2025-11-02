import { Form } from 'react-bootstrap';
import { $form } from '@src/signals';

const CheckBoxInput = ({
  name,
  signal = $form,
  label,
  className,
  id,
  ...rest
}) => (
  <Form.Group className="custom-checkbox">
    <input
      type="checkbox"
      id={id || name}
      name={name}
      className={`small me-8 ${className}`}
      checked={signal.value?.[name] ?? false}
      onChange={() => signal.update({ [name]: !signal.value?.[name] })}
      {...rest}
    />
    <Form.Label htmlFor={id || name}>{label}</Form.Label>
  </Form.Group>
);

export default CheckBoxInput;
