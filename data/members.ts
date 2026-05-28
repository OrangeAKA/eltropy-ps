// data/members.ts

export type Product = {
  type: 'checking' | 'savings' | 'credit_card' | 'auto_loan' | 'mortgage' | 'heloc'
  accountId: string
  openedDate: string
  balance?: number
  apr?: number
}

export type Member = {
  id: string
  fullName: string
  phone: string
  email: string
  dateOfBirth: string
  ssnLast4: string
  address: { street: string; city: string; state: string; zip: string }
  tenureYears: number
  memberTier: 'prime' | 'standard' | 'sub-prime'
  fico: number
  products: Product[]
  avatarSeed: string
}

export const members: Member[] = [
  {
    id: '8842914',
    fullName: 'Michael Tanaka',
    phone: '+12065554823',
    email: 'michael.tanaka@gmail.com',
    dateOfBirth: '1983-07-15',
    ssnLast4: '4219',
    address: {
      street: '4218 Fremont Ave N',
      city: 'Seattle',
      state: 'WA',
      zip: '98103',
    },
    tenureYears: 8.2,
    memberTier: 'prime',
    fico: 758,
    products: [
      {
        type: 'checking',
        accountId: 'CHK-1001-8842914',
        openedDate: '2017-10-03',
        balance: 8412.50,
      },
      {
        type: 'savings',
        accountId: 'SAV-2001-8842914',
        openedDate: '2017-10-03',
        balance: 33587.92,
      },
      {
        type: 'credit_card',
        accountId: 'CC-3001-8842914',
        openedDate: '2019-03-14',
        balance: 1248.37,
        apr: 18.99,
      },
      {
        type: 'auto_loan',
        accountId: 'AL-4001-8842914',
        openedDate: '2020-06-22',
        balance: 0,
        apr: 4.29,
      },
    ],
    avatarSeed: 'michael-tanaka-8842914',
  },
  {
    id: '7193052',
    fullName: 'Maria Vega',
    phone: '+17135558934',
    email: 'maria.vega@outlook.com',
    dateOfBirth: '1991-03-22',
    ssnLast4: '8371',
    address: {
      street: '1847 Westheimer Rd',
      city: 'Houston',
      state: 'TX',
      zip: '77098',
    },
    tenureYears: 3.5,
    memberTier: 'standard',
    fico: 692,
    products: [
      {
        type: 'checking',
        accountId: 'CHK-1001-7193052',
        openedDate: '2022-09-08',
        balance: 3248.60,
      },
      {
        type: 'savings',
        accountId: 'SAV-2001-7193052',
        openedDate: '2022-09-08',
        balance: 8762.14,
      },
      {
        type: 'auto_loan',
        accountId: 'AL-4001-7193052',
        openedDate: '2023-02-15',
        balance: 18247.83,
        apr: 7.49,
      },
    ],
    avatarSeed: 'maria-vega-7193052',
  },
]
