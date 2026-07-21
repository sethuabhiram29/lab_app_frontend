import Equipment from './Equipment';
import Commission from './Commission';
import AccountsBalance from './AccountsBalance';
import withPinProtection from './withPinProtection';

export const ProtectedEquipment = withPinProtection(Equipment);
export const ProtectedCommission = withPinProtection(Commission);
export const ProtectedAccountsBalance = withPinProtection(AccountsBalance);
