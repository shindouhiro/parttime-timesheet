import type { TimesheetWorkbook } from '../types/timesheet'

export function createInitialTimesheet(): TimesheetWorkbook {
  return {
    title: '工作记录表',
    month: 11,
    breakHours: 1.5,
    records: [
      {
        id: 'rec-2026-11-10',
        date: '2026-11-10',
        startTime: '09:30',
        endTime: '20:30',
        content:
          '题库与考试\n完善试题与知识点的关联及必填校验，处理未关联知识点时的显示。\n打通智能组卷方式选择、考试快照、样卷接口及试卷查看页面，补齐创建、预览和查看环节。\n调整考试统计和试题解析开关，更新课程体系下线涉及的课程性质字典配置。',
        summary: '',
        manualHours: null,
        basis: '',
      },
      {
        id: 'rec-2026-11-11',
        date: '2026-11-11',
        startTime: '09:30',
        endTime: '20:30',
        content:
          '考试配置回归\n重构试题解析开关的端到端用例，补充开启解析后的页面行为验证。\n排查课程性质、考试性质下拉选项的数据来源，修复已停用和已删除字典项仍被返回的问题。\n梳理免登录问卷的用户身份识别及后端解密接入方式。',
        summary: '',
        manualHours: null,
        basis: '',
      },
      {
        id: 'rec-2026-11-12',
        date: '2026-11-12',
        startTime: '09:30',
        endTime: '19:30',
        content:
          '组卷与培训审批\n将智能样卷改为试题预览，补齐组卷数据校验，增加组卷、试题导入相关单元测试。\n修复培训审批字典数据异常。\n梳理问卷积分发放开关、密文用户标识解密后向积分接口传递的流程，以及端到端验收步骤。',
        summary: '',
        manualHours: null,
        basis: '',
      },
      {
        id: 'rec-2026-11-13',
        date: '2026-11-13',
        startTime: '09:30',
        endTime: '20:00',
        content:
          '免登录问卷对接方案\n拆解问卷提交后的处理链路，梳理 URL 密文用户标识解密、字段传递和积分发放之间的关系。\n整理用户标识别名兼容、字符串格式保留、默认密钥配置及调用日志要求，作为接口联调与验收的依据。',
        summary: '',
        manualHours: null,
        basis: '',
      },
      {
        id: 'rec-2026-11-16',
        date: '2026-11-16',
        startTime: '09:30',
        endTime: '20:00',
        content:
          '学员端课件阅读与后台视频课件上传\n学员端：将 PDF 课件由逐页翻阅改为连续滚动，调整长文档的页面加载方式。同步修正学习进度记录，学员回看前页时保留已读进度，文件加载失败时暂停记录。\n管理端：完善视频课件从上传到可播放的流程。补齐 MOV、M4V 的上传校验、后台转换和进度提示；转换完成后使用浏览器兼容的 MP4 资源。配套更新部署环境和接口说明。\n测试：补充 PDF 连续阅读、全屏和文件异常用例，以及视频上传、转换任务与状态处理用例。',
        summary: '',
        manualHours: null,
        basis: '',
      },
      {
        id: 'rec-2026-11-17',
        date: '2026-11-17',
        startTime: '09:30',
        endTime: '19:00',
        content:
          '看板基础搭建与镜像构建优化\n搭建数据看板模块入口，梳理门店和区域管理员的访问权限，整理区域、门店、岗位和职级的共用筛选条件，为各主题页面接入做准备。\n调整前端和 API 的镜像构建配置，接入 Harbor 基础镜像与 BuildKit 缓存，更新构建入口、推送脚本和使用说明。',
        summary: '',
        manualHours: null,
        basis: '',
      },
      {
        id: 'rec-2026-11-18',
        date: '2026-11-18',
        startTime: '09:30',
        endTime: '20:00',
        content:
          '数据看板页面建设与接口联调\n看板开发：建设八类看板页面，接入多维查询，联调级联筛选、日期粒度和指标说明。\n缺陷处理：补齐考试答卷题干及选项图片展示，支持长答卷滚动；修复 H5「我的培训」长标题和详情在窄屏溢出，补充 320px、390px 布局用例；完善视频格式校验，MP4 直接上传，MOV 校验后转码。',
        summary: '',
        manualHours: null,
        basis: '',
      },
      {
        id: 'rec-2026-11-19',
        date: '2026-11-19',
        startTime: '09:30',
        endTime: '21:00',
        content:
          '看板查询优化与回归，晋升及人员同步\n看板回归与优化：核对入口跳转及失败重试；修复页面重复查询，补充请求次数验证，加入两级缓存与并发查询合并；补齐指标卡片样式测试。\n缺陷处理：修复登录页密码框无法获取焦点；修复 SDS 全量同步覆盖已有员工岗位等级，补充按需更新与字段保留验证。\n晋升考核：完善资源版本匹配、成绩来源追溯和补考处理。',
        summary: '',
        manualHours: null,
        basis: '',
      },
      {
        id: 'rec-2026-11-20',
        date: '2026-11-20',
        startTime: '09:30',
        endTime: '19:30',
        content:
          '兼容性与稳定性修复\n同步员工档案等级保护改动，明确新建档案设为无等级、已有档案保留 LMS 管理的岗位等级。\n处理 Safari 17.6 等浏览器的 PDF 无法预览问题。\n修订本地缓存满额时的淘汰顺序、过期判断及缓存键转义逻辑。',
        summary: '',
        manualHours: null,
        basis: '',
      },
      {
        id: 'rec-2026-11-23',
        date: '2026-11-23',
        startTime: '09:30',
        endTime: '19:30',
        content:
          '考试与培训缺陷验收\n试卷与考试：补齐题库分组筛题、人工组卷分页及试卷名称校验，回归全部题库考试编辑和题库名称回显（LMSSER-644、645、647、650）。\n任务与培训：覆盖学员资格作废、多场次任务试卷展示、班级考试选项刷新及进行中班级取消开班提示（LMSSER-649、651、615、626）。\n验收：补充图文答卷交卷用例，留存考试、员工与答卷记录附件（LMSSER-646）；补充人员看板区域及岗位搜索验证。',
        summary: '考试培训缺陷修复、回归用例及验收附件',
        manualHours: null,
        basis: '',
      },
      {
        id: 'rec-2026-11-24',
        date: '2026-11-24',
        startTime: '14:00',
        endTime: '',
        content: '1.搭建企业微信NPS本地调试环境',
        summary: '',
        manualHours: null,
        basis: '',
      },
    ],
    reviewTitle: '11 月 16 日工时复核',
    reviewTargetDate: '2026-11-16',
    reviewItems: [
      {
        id: 'rev-1',
        task: 'PDF 连续阅读、学习进度处理及相关测试',
        verifiableRecord: '37ef699eb',
        submitDate: '2026-11-16',
        actualDate: '2026-11-16',
        actualHours: 3.5,
        notes:
          '(前端渲染优化) 引入虚拟滚动解决长 PDF 连续渲染导致的内存溢出及卡顿问题；基于 Intersection Observer 实现防抖监听，精准捕捉当前阅读页码并上报学习进度；补充断网和快速滑动场景的边界异常测试用例。',
      },
      {
        id: 'rev-2',
        task: '视频上传、转换状态接入及环境配置',
        verifiableRecord: '96f06d07e',
        submitDate: '2026-11-16',
        actualDate: '2026-11-16',
        actualHours: 2,
        notes:
          '(工程化与交互) 封装大文件分片上传组件，并对接后端的转换状态轮询接口；修改 Nginx 及网关配置（调大 client_max_body_size 及超时时间）以支持大体积视频直传；处理转换中、失败等状态的 UI 兜底交互。',
      },
      {
        id: 'rev-3',
        task: '异步转码服务与相关单元测试',
        verifiableRecord: 'cb8ccead4',
        submitDate: '2026-11-16',
        actualDate: '2026-11-16',
        actualHours: 2.5,
        notes:
          '(后端与测试) 完善后台异步转码任务流（整合 FFmpeg），处理并发转码的资源占用控制；编写核心转码逻辑及状态回调的单元测试，Mock 视频文件以覆盖超时、格式损坏等异常链路。',
      },
      {
        id: 'rev-4',
        task: '其他实际发生的工作（如有）',
        verifiableRecord: '',
        submitDate: '',
        actualDate: '2026-11-16',
        actualHours: 1,
        notes:
          '(全链路联调与合并) 解决本迭代多条分支合并时产生的代码冲突，进行端到端联调（从视频上传、异步转码到学员端播放）；梳理并 Review 相关合并请求，确保主干代码规范与交付质量。',
      },
    ],
    extraReviewItems: [
      {
        id: 'rev-extra-1',
        task: '前端构建提速、CI/CD 缓存优化与依赖安全排查',
        verifiableRecord: '18a4d7c2 (示例Commit)',
        submitDate: '2026-11-17',
        actualDate: '2026-11-17',
        actualHours: 4,
        notes:
          '(前端工程与基建) 针对近期 CI 流水线偶发 OOM 及构建耗时过长问题，排查并剥离无用的庞大依赖（如旧版图表库）；调整 Monorepo 的 pnpm 缓存策略和 Dockerfile 分层构建，将打包时长压缩约 30%；处理了 2 个高危 npm 依赖的安全升级及 API 兼容性回归。',
      },
    ],
  }
}
