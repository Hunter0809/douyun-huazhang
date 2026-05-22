import React, { useState } from 'react';

interface SettingsPanelProps {
  guidanceMode: 'nearest' | 'largest' | 'edge-first';
  onGuidanceModeChange: (mode: 'nearest' | 'largest' | 'edge-first') => void;
  gridSectionInterval: number;
  onGridSectionIntervalChange: (interval: number) => void;
  showSectionLines: boolean;
  onShowSectionLinesChange: (show: boolean) => void;
  sectionLineColor: string;
  onSectionLineColorChange: (color: string) => void;
  enableCelebration: boolean;
  onEnableCelebrationChange: (enable: boolean) => void;
  onClose: () => void;
  /** 重置所有进度回调 */
  onResetProgress?: () => void;
  language?: 'zh' | 'en';
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  guidanceMode,
  onGuidanceModeChange,
  gridSectionInterval,
  onGridSectionIntervalChange,
  showSectionLines,
  onShowSectionLinesChange,
  sectionLineColor,
  onSectionLineColorChange,
  enableCelebration,
  onEnableCelebrationChange,
  onClose,
  onResetProgress,
  language = 'zh',
}) => {
  const [resetConfirm, setResetConfirm] = useState(false);
  const L = (zh: string, en: string) => language === 'en' ? en : zh;

  // 分割线颜色选项
  const sectionLineColors = [
    { color: '#007acc', name: L('蓝色', 'Blue') },
    { color: '#28a745', name: L('绿色', 'Green') },
    { color: '#dc3545', name: L('红色', 'Red') },
    { color: '#6f42c1', name: L('紫色', 'Purple') },
    { color: '#fd7e14', name: L('橙色', 'Orange') },
    { color: '#6c757d', name: L('灰色', 'Gray') }
  ];
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end">
      <div className="w-80 max-w-[90vw] h-full bg-white shadow-lg flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">{L('设置', 'Settings')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 设置内容 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 引导设置 */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-3">{L('智能引导', 'Smart Guidance')}</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="guidanceMode"
                  value="nearest"
                  checked={guidanceMode === 'nearest'}
                  onChange={(e) => onGuidanceModeChange(e.target.value as 'nearest')}
                  className="mr-3 text-blue-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">{L('最近优先', 'Nearest First')}</div>
                  <div className="text-xs text-gray-500">{L('推荐距离最近的格子', 'Recommend the nearest cells')}</div>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="guidanceMode"
                  value="largest"
                  checked={guidanceMode === 'largest'}
                  onChange={(e) => onGuidanceModeChange(e.target.value as 'largest')}
                  className="mr-3 text-blue-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">{L('大块优先', 'Largest First')}</div>
                  <div className="text-xs text-gray-500">{L('优先推荐大色块区域', 'Recommend large color regions first')}</div>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="guidanceMode"
                  value="edge-first"
                  checked={guidanceMode === 'edge-first'}
                  onChange={(e) => onGuidanceModeChange(e.target.value as 'edge-first')}
                  className="mr-3 text-blue-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">{L('边缘优先', 'Edges First')}</div>
                  <div className="text-xs text-gray-500">{L('先完成边缘，再填充内部', 'Complete edges before filling inside')}</div>
                </div>
              </label>
            </div>
          </div>

          {/* 显示设置 */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-3">{L('显示设置', 'Display Settings')}</h3>
            <div className="space-y-4">
              {/* 分割线开关 */}
              <label className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">{L('显示分割线', 'Show Section Lines')}</div>
                  <div className="text-xs text-gray-500">{L('将画布分割成区块帮助定位', 'Divide the canvas into sections for locating')}</div>
                </div>
                <input
                  type="checkbox"
                  checked={showSectionLines}
                  onChange={(e) => onShowSectionLinesChange(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </label>

              {/* 只有开启分割线时才显示后续选项 */}
              {showSectionLines && (
                <>
                  {/* 分割线间隔 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      {L('分割间隔', 'Section Interval')}
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="5"
                        max="20"
                        value={gridSectionInterval}
                        onChange={(e) => onGridSectionIntervalChange(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
                        {gridSectionInterval} {L('格', 'cells')}
                      </span>
                    </div>
                  </div>

                  {/* 分割线颜色 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      {L('分割线颜色', 'Section Line Color')}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {sectionLineColors.map((colorOption) => (
                        <button
                          key={colorOption.color}
                          onClick={() => onSectionLineColorChange(colorOption.color)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            sectionLineColor === colorOption.color
                              ? 'border-gray-800 scale-110'
                              : 'border-gray-300 hover:border-gray-500'
                          }`}
                          style={{ backgroundColor: colorOption.color }}
                          title={colorOption.name}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 庆祝动画开关 */}
              <label className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">{L('庆祝动画', 'Celebration Animation')}</div>
                  <div className="text-xs text-gray-500">{L('完成颜色时显示撒花效果', 'Show celebration when a color is complete')}</div>
                </div>
                <input
                  type="checkbox"
                  checked={enableCelebration}
                  onChange={(e) => onEnableCelebrationChange(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </label>
            </div>
          </div>



          {/* 进度重置 */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-3">{L('数据管理', 'Data Management')}</h3>
            <div className="space-y-3">
              <button className="w-full py-2 px-4 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm">
                {L('导出进度数据', 'Export Progress Data')}
              </button>

              {resetConfirm ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 font-medium">{L('确定要重置所有进度吗？此操作不可撤销。', 'Reset all progress? This cannot be undone.')}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onResetProgress?.();
                        setResetConfirm(false);
                        onClose();
                      }}
                      className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      {L('确认重置', 'Reset')}
                    </button>
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      {L('取消', 'Cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="w-full py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  {L('重置所有进度', 'Reset All Progress')}
                </button>
              )}
            </div>
          </div>

          {/* 关于信息 */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-3">{L('关于', 'About')}</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>{L('专心拼豆模式 v1.0', 'Focus Beading Mode v1.0')}</p>
              <p>{L('专为手机设计的拼豆助手', 'A mobile-first bead crafting assistant')}</p>
              <div className="pt-2 text-xs text-gray-500">
                <p>{L('💡 提示：长按格子可以快速标记', 'Tip: long-press cells for quick marking')}</p>
                <p>{L('💡 提示：双指缩放可以查看细节', 'Tip: pinch to zoom into details')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
