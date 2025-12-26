-- Remove legacy loyalty points settings from settings table
-- These have been migrated to system_settings table
DELETE FROM "settings" 
WHERE "key" IN ('loyalty_points_attribution_rate', 'loyalty_points_conversion_rate');

