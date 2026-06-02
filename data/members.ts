// data/members.ts

export type Product = {
  type: 'checking' | 'savings' | 'credit_card' | 'auto_loan' | 'mortgage' | 'heloc' | 'money_market'
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
  monthlyIncome: number
  monthlyDebts: number
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
    monthlyIncome: 9500,
    monthlyDebts: 1800,
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
    monthlyIncome: 5200,
    monthlyDebts: 1400,
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
  {
    id: '5064731',
    fullName: 'James Patterson',
    phone: '+15095554412',
    email: 'james.patterson@comcast.net',
    dateOfBirth: '1951-04-28',
    ssnLast4: '6038',
    address: {
      street: '3214 N Monroe St',
      city: 'Spokane',
      state: 'WA',
      zip: '99205',
    },
    tenureYears: 15.8,
    memberTier: 'prime',
    fico: 780,
    monthlyIncome: 4200,
    monthlyDebts: 380,
    products: [
      {
        type: 'checking',
        accountId: 'CHK-1001-5064731',
        openedDate: '2010-03-12',
        balance: 4820.00,
      },
      {
        type: 'savings',
        accountId: 'SAV-2001-5064731',
        openedDate: '2010-03-12',
        balance: 47318.55,
      },
      {
        type: 'money_market',
        accountId: 'MM-5001-5064731',
        openedDate: '2014-08-01',
        balance: 89402.17,
      },
      {
        type: 'mortgage',
        accountId: 'MRT-6001-5064731',
        openedDate: '2011-05-15',
        balance: 0,
        apr: 3.75,
      },
      {
        type: 'credit_card',
        accountId: 'CC-3001-5064731',
        openedDate: '2012-07-20',
        balance: 342.18,
        apr: 16.49,
      },
    ],
    avatarSeed: 'james-patterson-5064731',
  },
  {
    id: '6318405',
    fullName: 'Aisha Williams',
    phone: '+17135557261',
    email: 'aisha.williams@yahoo.com',
    dateOfBirth: '1989-11-07',
    ssnLast4: '2914',
    address: {
      street: '7891 Almeda Rd',
      city: 'Houston',
      state: 'TX',
      zip: '77054',
    },
    tenureYears: 1.2,
    memberTier: 'standard',
    fico: 670,
    monthlyIncome: 8100,
    monthlyDebts: 3240,
    products: [
      {
        type: 'checking',
        accountId: 'CHK-1001-6318405',
        openedDate: '2025-01-14',
        balance: 2183.40,
      },
      {
        type: 'credit_card',
        accountId: 'CC-3001-6318405',
        openedDate: '2025-01-14',
        balance: 4318.72,
        apr: 24.99,
      },
    ],
    avatarSeed: 'aisha-williams-6318405',
  },
  {
    id: '9247163',
    fullName: 'Tom Chen',
    phone: '+18015552847',
    email: 'tom.chen@gmail.com',
    dateOfBirth: '1999-08-19',
    ssnLast4: '5571',
    address: {
      street: '544 E 400 S',
      city: 'Salt Lake City',
      state: 'UT',
      zip: '84111',
    },
    tenureYears: 0.6,
    memberTier: 'sub-prime',
    fico: 615,
    monthlyIncome: 2800,
    monthlyDebts: 420,
    products: [
      {
        type: 'checking',
        accountId: 'CHK-1001-9247163',
        openedDate: '2025-11-03',
        balance: 487.22,
      },
    ],
    avatarSeed: 'tom-chen-9247163',
  },
  {
    id: '2947561',
    fullName: 'Maria Santos',
    phone: '+14155559283',
    email: 'maria.santos@icloud.com',
    dateOfBirth: '1994-06-12',
    ssnLast4: '3847',
    address: {
      street: '820 Valencia St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94110',
    },
    tenureYears: 4.1,
    memberTier: 'prime',
    fico: 731,
    monthlyIncome: 7200,
    monthlyDebts: 1100,
    products: [
      {
        type: 'checking',
        accountId: 'CHK-1001-2947561',
        openedDate: '2022-03-18',
        balance: 4218.45,
      },
      {
        type: 'savings',
        accountId: 'SAV-2001-2947561',
        openedDate: '2022-03-18',
        balance: 12840.30,
      },
    ],
    avatarSeed: 'maria-santos-2947561',
  },
  {
    id: '6104823',
    fullName: 'Robert Kim',
    phone: '+12135558761',
    email: 'robert.kim@gmail.com',
    dateOfBirth: '1979-09-03',
    ssnLast4: '9162',
    address: {
      street: '3401 Wilshire Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90010',
    },
    tenureYears: 6.7,
    memberTier: 'prime',
    fico: 763,
    monthlyIncome: 11200,
    monthlyDebts: 2940,
    products: [
      {
        type: 'checking',
        accountId: 'CHK-1001-6104823',
        openedDate: '2019-07-14',
        balance: 6542.88,
      },
      {
        type: 'savings',
        accountId: 'SAV-2001-6104823',
        openedDate: '2019-07-14',
        balance: 28317.50,
      },
      {
        type: 'credit_card',
        accountId: 'CC-3001-6104823',
        openedDate: '2020-01-09',
        balance: 1872.34,
        apr: 17.49,
      },
    ],
    avatarSeed: 'robert-kim-6104823',
  },
  {
    id: '3851920',
    fullName: 'Linda Rodriguez',
    phone: '+13035556094',
    email: 'linda.rodriguez@rodriguezcontracting.com',
    dateOfBirth: '1975-02-14',
    ssnLast4: '7403',
    address: {
      street: '1623 S Zuni St',
      city: 'Denver',
      state: 'CO',
      zip: '80223',
    },
    tenureYears: 7.0,
    memberTier: 'prime',
    fico: 745,
    monthlyIncome: 12500,
    monthlyDebts: 4125,
    products: [
      {
        type: 'checking',
        accountId: 'CHK-1001-3851920',
        openedDate: '2019-02-18',
        balance: 9841.75,
      },
      {
        type: 'savings',
        accountId: 'SAV-2001-3851920',
        openedDate: '2019-02-18',
        balance: 31204.60,
      },
      {
        type: 'credit_card',
        accountId: 'CC-3001-3851920',
        openedDate: '2019-06-30',
        balance: 2891.04,
        apr: 19.99,
      },
      {
        type: 'auto_loan',
        accountId: 'AL-4001-3851920',
        openedDate: '2024-04-10',
        balance: 28347.50,
        apr: 7.50,
      },
    ],
    avatarSeed: 'linda-rodriguez-3851920',
  },
]
