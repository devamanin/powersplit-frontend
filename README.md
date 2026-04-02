# PowerSplit - Electricity Bill Splitter

A smart Angular application to split electricity bills fairly among roommates based on their actual usage.

## Features

✨ **Key Features:**
- **Add Roommates**: Manage multiple roommates living together
- **Select Month**: Choose the month and year for billing
- **Mark Vacation Days**: Exclude days when roommates are away
- **Define Daily Stay Hours**: Set custom hours for each day (default: 24)
- **Auto-calculate Usage**: Automatically calculates total hours per roommate
- **Auto Split Bill**: Splits the bill proportionally based on usage
- **Show Settlement**: Displays who pays whom to settle the bill

## Use Case Example

**Scenario:**
- Total monthly electricity bill: $700
- Roommate A: Stays 24 hours every day (except weekends & vacations)
- Roommate B: Stays only 15 hours on weekdays (9 AM - 12 AM, excluding weekends & vacations)

**Calculation:**
- Weekdays = 22 days (excluding 8 weekend days in a 30-day month)
- Roommate A: 22 days × 24 hours = 528 hours
- Roommate B: 22 days × 15 hours = 330 hours
- Total: 858 hours

**Bill Split:**
- Roommate A: (528/858) × $700 = $430.07
- Roommate B: (330/858) × $700 = $269.93

## Installation

1. **Clone or download the project**
   ```bash
   cd powersplit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   Navigate to `http://localhost:4200/`

## How to Use

1. **Setup**
   - Select the month and year
   - Enter the total electricity bill
   - The app automatically calculates the number of days in the month

2. **Add Roommates**
   - Enter roommate names one by one
   - Click "Add Roommate"

3. **Configure Each Roommate**
   - Select a roommate from the dropdown
   - Mark vacation days (comma-separated numbers, e.g., 1,5,10)
   - Set daily stay hours (default is 24 hours per day)
   - Weekends are automatically excluded

4. **Calculate Bill**
   - Click "Calculate Bill Split"
   - View the usage breakdown and settlement details

5. **Settlement**
   - See who needs to pay whom and how much
   - Use this to settle the bill among roommates

## Project Structure

```
powersplit/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   └── bill.service.ts     # Core logic for bill calculations
│   │   ├── app.component.ts        # Main component
│   │   ├── app.component.html      # UI template
│   │   ├── app.component.scss      # Styling
│   │   ├── app.config.ts           # Angular configuration
│   │   └── app.routes.ts           # Routing
│   ├── index.html
│   └── styles.scss
├── package.json
├── angular.json
├── tsconfig.json
└── README.md
```

## Technology Stack

- **Angular 17+**: Modern web framework
- **TypeScript**: Strong typing
- **RxJS**: Reactive programming
- **SCSS**: Advanced styling
- **Bootstrap Grid**: Responsive design

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Author

PowerSplit Team © 2026
