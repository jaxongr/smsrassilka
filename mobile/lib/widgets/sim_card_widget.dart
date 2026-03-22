import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/theme.dart';
import '../models/sim_info.dart';

class SimCardWidget extends StatelessWidget {
  final SimInfo? simInfo;
  final int slotIndex;
  final int smsSent;
  final int callsMade;

  const SimCardWidget({
    super.key,
    this.simInfo,
    required this.slotIndex,
    this.smsSent = 0,
    this.callsMade = 0,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = simInfo != null;

    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingM),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(AppTheme.radiusLarge),
        border: Border.all(
          color: isActive ? AppTheme.cardBorder : AppTheme.cardBorder,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacingS,
                  vertical: AppTheme.spacingXS,
                ),
                decoration: BoxDecoration(
                  color: isActive
                      ? AppTheme.primary.withOpacity(0.1)
                      : AppTheme.textHint.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                ),
                child: Text(
                  'SIM ${slotIndex + 1}',
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isActive ? AppTheme.primary : AppTheme.textHint,
                  ),
                ),
              ),
              const SizedBox(width: AppTheme.spacingS),
              Expanded(
                child: Text(
                  isActive ? simInfo!.operatorName : 'Topilmadi',
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: isActive
                        ? AppTheme.textPrimary
                        : AppTheme.textHint,
                  ),
                ),
              ),
              Icon(
                isActive ? Icons.sim_card : Icons.sim_card_outlined,
                color: isActive ? AppTheme.successColor : AppTheme.textHint,
                size: 20,
              ),
            ],
          ),
          if (isActive) ...[
            const SizedBox(height: AppTheme.spacingM),
            if (simInfo!.phoneNumber != null)
              Padding(
                padding: const EdgeInsets.only(bottom: AppTheme.spacingS),
                child: Text(
                  simInfo!.phoneNumber!,
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ),
            Row(
              children: [
                _buildStat(Icons.sms_outlined, '$smsSent SMS'),
                const SizedBox(width: AppTheme.spacingM),
                _buildStat(Icons.call_outlined, '$callsMade qo\'ng\'iroq'),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStat(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppTheme.textSecondary),
        const SizedBox(width: AppTheme.spacingXS),
        Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 12,
            color: AppTheme.textSecondary,
          ),
        ),
      ],
    );
  }
}
