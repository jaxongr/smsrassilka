import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';
import '../../providers/task_queue_provider.dart';
import '../../widgets/task_list_tile.dart';

enum LogFilter { all, sms, call, error }

class LogsScreen extends ConsumerStatefulWidget {
  const LogsScreen({super.key});

  @override
  ConsumerState<LogsScreen> createState() => _LogsScreenState();
}

class _LogsScreenState extends ConsumerState<LogsScreen> {
  LogFilter _activeFilter = LogFilter.all;

  List<TaskQueueItem> _filterTasks(List<TaskQueueItem> tasks) {
    switch (_activeFilter) {
      case LogFilter.all:
        return tasks;
      case LogFilter.sms:
        return tasks.where((t) => t.type == TaskType.sms).toList();
      case LogFilter.call:
        return tasks.where((t) => t.type == TaskType.call).toList();
      case LogFilter.error:
        return tasks
            .where((t) => t.status == TaskItemStatus.failed)
            .toList();
    }
  }

  @override
  Widget build(BuildContext context) {
    final tasks = ref.watch(taskQueueProvider);
    final filteredTasks = _filterTasks(tasks);

    return Scaffold(
      backgroundColor: AppTheme.bgBody,
      appBar: AppBar(
        title: const Text('Jurnal'),
      ),
      body: Column(
        children: [
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingM,
              vertical: AppTheme.spacingS,
            ),
            child: Row(
              children: [
                _buildFilterChip('Hammasi', LogFilter.all),
                const SizedBox(width: AppTheme.spacingS),
                _buildFilterChip('SMS', LogFilter.sms),
                const SizedBox(width: AppTheme.spacingS),
                _buildFilterChip('Qo\'ng\'iroq', LogFilter.call),
                const SizedBox(width: AppTheme.spacingS),
                _buildFilterChip('Xato', LogFilter.error),
              ],
            ),
          ),

          // Task List
          Expanded(
            child: filteredTasks.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    color: AppTheme.primary,
                    onRefresh: () async {},
                    child: ListView.builder(
                      padding: const EdgeInsets.all(AppTheme.spacingM),
                      itemCount: filteredTasks.length,
                      itemBuilder: (context, index) {
                        return TaskListTile(task: filteredTasks[index]);
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, LogFilter filter) {
    final isActive = _activeFilter == filter;

    return GestureDetector(
      onTap: () => setState(() => _activeFilter = filter),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingM,
          vertical: AppTheme.spacingS,
        ),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.primary : AppTheme.cardBg,
          borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
          border: Border.all(
            color: isActive ? AppTheme.primary : AppTheme.cardBorder,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: isActive ? Colors.white : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.inbox_outlined,
            size: 64,
            color: AppTheme.textHint.withOpacity(0.5),
          ),
          const SizedBox(height: AppTheme.spacingM),
          Text(
            'Ma\'lumot topilmadi',
            style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: AppTheme.spacingS),
          Text(
            'Hozircha hech qanday faoliyat yo\'q',
            style: GoogleFonts.outfit(
              fontSize: 13,
              color: AppTheme.textHint,
            ),
          ),
        ],
      ),
    );
  }
}
