# TKO Toy Co Loyalty Program - Product Context

**IMPORTANT: Always read .clinerules first, followed by ALL memory bank files at the start of EVERY task.**

See `memory-bank/taskWorkflow.md` for detailed task management procedures.

## Business Problem

TKO Toy Co is a specialty retailer of Trading Card Game (TCG) products, focusing primarily on Pokémon, Magic The Gathering, and One Piece card games, along with related accessories and collectibles. They operate both physical stores and an online Shopify presence. While they have a dedicated customer base, they face several challenges:

1. **Customer Retention**: In the competitive collectibles market, customer loyalty is crucial but difficult to maintain without structured incentives.

2. **Purchase Frequency**: Customers may make sporadic purchases rather than regular visits.

3. **Average Order Value**: There's potential to increase the average spend per customer through targeted incentives.

4. **Cross-Channel Shopping**: Customers who shop both in-store and online represent higher lifetime value, but there's currently no system to encourage this behavior.

5. **Premium Experience**: TKO Toy Co wants to differentiate itself by offering a premium, exclusive experience for loyal customers.

The loyalty program aims to address these challenges by creating a structured system that rewards customer loyalty, encourages repeat purchases, and enhances the overall customer experience. The program features a unique boxing-themed tier system with levels named after boxing weight classes (Featherweight, Lightweight, Welterweight, Heavyweight, and Champion), adding a distinctive and memorable branding element to the loyalty experience.

## User Personas

### Store Staff (Admin Users)

**Profile**: Store managers and employees who will administer the loyalty program.

**Goals**:

- Easily look up customer information and loyalty status
- Quickly apply rewards and discounts at checkout
- Manage program settings without technical expertise
- Access reports on program performance
- Register new customers for the program

**Pain Points**:

- Limited time for complex administrative tasks
- Need for simple, intuitive interfaces
- Potential resistance to new technology
- Concern about additional workload

### Customers (End Users)

**Profile**: Collectors and enthusiasts who purchase from TKO Toy Co.

**Goals**:

- Receive recognition for their loyalty
- Earn valuable rewards for their spending
- Experience a premium, exclusive membership
- Easily understand their status and benefits
- Seamlessly use their membership across channels

**Pain Points**:

- Loyalty programs that are too complex to understand
- Rewards that aren't valuable or relevant
- Difficulty tracking status or available benefits
- Inconsistent experience between online and in-store

## User Experience Goals

### For Admin Users

1. **Simplicity**: The system should be intuitive and require minimal training.
2. **Efficiency**: Common tasks should be accomplishable in just a few clicks.
3. **Visibility**: Important information should be easily accessible.
4. **Flexibility**: Admins should be able to customize program parameters.
5. **Reliability**: The system should work consistently without technical issues.

### For Customers

1. **Transparency**: Clear communication about tier status, points, and rewards.
2. **Value**: Meaningful rewards that enhance the collecting experience.
3. **Exclusivity**: A sense of belonging to a premium club.
4. **Consistency**: Seamless experience across in-store and online channels.
5. **Simplicity**: Easy to understand and participate in the program.

## Key Workflows

### Customer Registration

1. Staff member collects customer information (name, phone, email)
2. System creates new customer profile
3. Physical membership card is activated and linked to profile
4. Welcome email is sent to customer
5. Initial tier assignment based on purchase history (if available)

### Purchase Processing

1. Customer is identified via phone number or membership card
2. Purchase is recorded and associated with customer account
3. System updates customer's total spend
4. System checks for tier changes based on new total
5. Any applicable rewards are offered
6. Transaction confirmation includes loyalty program status update

### Tier Management

1. System regularly evaluates customer spending against tier thresholds
2. When threshold is reached, customer is upgraded to new tier
3. Notification is sent to customer about new status
4. New tier benefits are activated
5. If physical card needs replacement for new tier, notification is sent

### Reward Redemption

1. Customer requests to use available reward
2. Staff verifies reward availability in system
3. Reward is applied to transaction
4. System marks reward as redeemed
5. Confirmation is provided to customer

### Program Administration

1. Admin accesses dashboard
2. Views program performance metrics
3. Adjusts tier thresholds or rewards as needed
4. Creates special promotions or limited-time offers
5. Generates reports for management review

## Integration Points

1. **Shopify Integration**

   - Customer identification
   - Purchase tracking
   - Reward application
   - Online tier display

2. **POS Binder Integration**

   - In-store purchase tracking
   - Customer lookup
   - Reward application
   - Card scanning

3. **Email Service Integration**
   - Welcome messages
   - Tier change notifications
   - Special offer announcements
   - Reward availability alerts

## Success Metrics

1. **Customer Retention Rate**: Increase in repeat customers
2. **Purchase Frequency**: Increase in average purchases per customer
3. **Average Order Value**: Increase in average transaction size
4. **Program Participation**: Percentage of customers enrolled in program
5. **Cross-Channel Shopping**: Increase in customers who shop both online and in-store
6. **Tier Distribution**: Healthy distribution of customers across tiers
7. **Reward Redemption Rate**: Percentage of available rewards that are redeemed

## Future Considerations

1. **Mobile App**: Potential development of a dedicated mobile application
2. **Gamification Elements**: Adding collection-related challenges or achievements
3. **Partner Rewards**: Collaboration with related businesses or brands
4. **Advanced Analytics**: Deeper insights into customer behavior and program performance
5. **Personalized Recommendations**: Using purchase history to suggest products
