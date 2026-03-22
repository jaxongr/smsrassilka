import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/theme.dart';
import '../providers/task_queue_provider.dart';

class TaskListTile extends StatelessWidget {
  final TaskQueueItem task;

  const TaskListTile({super.key, required this.task});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppTheme.spacingS),
      padding: const EdgeInsets.all(AppTheme.spacingM),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
        border: Border.all(color: AppTheme.cardBorder),
      ),
      child: Row(
        children: [
          _buildTypeIcon(),
          const SizedBox(width: AppTheme.spacingM),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.phoneNumber,
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: AppTheme.spacingXS),
                Text(
                  _formatTimestamp(task.timestamp),
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                ),
                if (task.errorMessage != null) ...[
                  const SizedBox(height: AppTheme.spacingXS),
                  Text(
                    task.errorMessage!,
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      color: AppTheme.errorColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
          _buildStatusBadge(),
        ],
      ),
    );
  }

  Widget _buildTypeIcon() {
    final isSms = task.type == TaskType.sms;
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: isSms
            ? AppTheme.primary.withOpacity(0.1)
            : AppTheme.accent.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
      ),
      child: Icon(
        isSms ? Icons.sms_outlined : Icons.call_outlined,
        size: 18,
        color: isSms ? AppTheme.primary : AppTheme.accent,
      ),
    );
  }

  Widget _buildStatusBadge() {
    Color color;
    IconData icon;

    switch (task.status) {
      case TaskItemStatus.pending:
        color = AppTheme.textHint;
        icon = Icons.schedule;
        break;
      case TaskItemStatus.processing:
        color = AppTheme.warningColor;
        icon = Icons.sync;
        break;
      case TaskItemStatus.success:
        color = AppTheme.successColor;
        icon = Icons.check_circle_outline;
        break;
      case TaskItemStatus.failed:
        color = AppTheme.errorColor;
        icon = Icons.error_outline;
        break;
    }

    return Icon(icon, size: 20, color: color);
  }

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inSeconds < 60) return 'Hozirgina';
    if (diff.inMinutes < 60) return '${diff.inMinutes} daqiqa oldin';
    if (diff.inHours < 24) return '${diff.inHours} soat oldin';
    return '${dt.day.toString().padLeft(2, '0')}.${dt.month.toString().padLeft(2, '0')} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}
