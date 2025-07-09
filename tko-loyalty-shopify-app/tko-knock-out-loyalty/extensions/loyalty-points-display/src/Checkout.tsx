import {
  reactExtension,
  useApi,
  useSettings,
  useCartLines,
  useCustomer,
  Banner,
  BlockStack,
  Text,
  InlineLayout,
  Divider,
} from '@shopify/ui-extensions-react/checkout';
import { useState, useEffect } from 'react';

interface PointsCalculation {
  spendPoints: number;
  bonusPoints: number;
  totalPoints: number;
  bonusEligibleAmount: number;
  appliedEvents: Array<{
    eventId: string;
    eventName: string;
    bonusPoints: number;
    bonusPercentage: number;
  }>;
  activeEventsCount: number;
}

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension />,
);

function Extension() {
  const { extension } = useApi();
  const settings = useSettings();
  const cartLines = useCartLines();
  const customer = useCustomer();

  // State for points calculation
  const [pointsData, setPointsData] = useState<PointsCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get settings
  const adminOnly = settings.admin_only === true;
  const title = settings.title || 'Loyalty Points You\'ll Earn';
  const showBreakdown = settings.show_breakdown !== false;

  // Calculate order totals
  const subtotal = cartLines.reduce((total: number, line: any) => {
    return total + (line.cost.totalAmount.amount * line.quantity);
  }, 0);

  // For admin-only mode, we'll show for all users in development
  // In production, you'd check if the current user is an admin
  const shouldShow = !adminOnly || true; // TODO: Add proper admin check

  // Fetch points calculation from API
  useEffect(() => {
    if (!shouldShow || cartLines.length === 0 || subtotal === 0) {
      return;
    }

    const fetchPointsCalculation = async () => {
      setLoading(true);
      setError(null);

      try {
        // Transform cart lines to match our API format
        const apiCartLines = cartLines.map((line: any) => ({
          product_id: line.merchandise.product?.id?.replace('gid://shopify/Product/', '') || '',
          variant_id: line.merchandise.id?.replace('gid://shopify/ProductVariant/', '') || '',
          title: line.merchandise.product?.title || line.merchandise.title || '',
          quantity: line.quantity,
          price: line.cost.totalAmount.amount,
          product_type: line.merchandise.product?.productType || '',
          tags: line.merchandise.product?.tags?.join(',') || '',
          variant_title: line.merchandise.title || '',
        }));

        // Make API call to calculate points
        const response = await fetch('/api/calculate-points', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartLines: apiCartLines,
            subtotal: subtotal,
            customerId: customer?.id,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate points');
        }

        const data = await response.json();
        
        if (data.success) {
          setPointsData(data);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error calculating points:', err);
        setError(err instanceof Error ? err.message : 'Failed to calculate points');
        
        // Fallback to simple calculation
        const spendPoints = Math.floor(subtotal);
        setPointsData({
          spendPoints,
          bonusPoints: 0,
          totalPoints: spendPoints,
          bonusEligibleAmount: subtotal,
          appliedEvents: [],
          activeEventsCount: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPointsCalculation();
  }, [cartLines, subtotal, customer, shouldShow]);

  // Don't show if admin-only mode is enabled and user is not admin
  if (!shouldShow) {
    return null;
  }

  // Don't show if no points would be earned
  if (!pointsData || pointsData.totalPoints === 0) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <Banner status="info">
        <Text>Calculating loyalty points...</Text>
      </Banner>
    );
  }

  return (
    <Banner status="success">
      <BlockStack spacing="tight">
        <Text emphasis="bold">{title}</Text>
        
        {showBreakdown ? (
          <BlockStack spacing="extraTight">
            <InlineLayout columns={['fill', 'auto']}>
              <Text>Spend Points:</Text>
              <Text emphasis="bold">{pointsData.spendPoints}</Text>
            </InlineLayout>
            
            {pointsData.bonusPoints > 0 && (
              <InlineLayout columns={['fill', 'auto']}>
                <Text>Bonus Points:</Text>
                <Text emphasis="bold" appearance="accent">{pointsData.bonusPoints}</Text>
              </InlineLayout>
            )}
            
            <Divider />
            
            <InlineLayout columns={['fill', 'auto']}>
              <Text emphasis="bold">Total Points:</Text>
              <Text emphasis="bold" appearance="accent">{pointsData.totalPoints}</Text>
            </InlineLayout>
          </BlockStack>
        ) : (
          <InlineLayout columns={['fill', 'auto']}>
            <Text>Points you'll earn:</Text>
            <Text emphasis="bold" appearance="accent">{pointsData.totalPoints}</Text>
          </InlineLayout>
        )}

        {pointsData.bonusPoints > 0 && pointsData.appliedEvents.length > 0 && (
          <BlockStack spacing="extraTight">
            <Text appearance="subdued" size="small">
              🎉 Active promotions:
            </Text>
            {pointsData.appliedEvents.map((event, index) => (
              <Text key={event.eventId} appearance="subdued" size="small">
                • {event.eventName}: +{event.bonusPoints} points ({event.bonusPercentage}% bonus)
              </Text>
            ))}
          </BlockStack>
        )}

        {pointsData.bonusPoints > 0 && pointsData.appliedEvents.length === 0 && (
          <Text appearance="subdued" size="small">
            🎉 You're earning bonus points from active promotions!
          </Text>
        )}

        {!customer && (
          <Text appearance="subdued" size="small">
            Sign in or create an account to earn loyalty points
          </Text>
        )}

        {error && (
          <Text appearance="critical" size="small">
            Note: Using basic calculation due to: {error}
          </Text>
        )}

        {adminOnly && (
          <Text appearance="warning" size="small">
            🔧 Admin Mode: This display is only visible during testing
          </Text>
        )}
      </BlockStack>
    </Banner>
  );
}
