"""
BOH后台URL配置
包含各个模块的路径配置
注意：这些是相对路径，需要配合 baseUrl 使用
"""

import os

URL_CONFIG = {
    # 组织管理URL
    'organization': {
        'company': '/metadata/company-info',           # 公司
        'store': '/metadata/store',                    # 门店
        'warehouse': '/metadata/warehouse',            # 仓库
        'supplier': '/metadata/franchisee'             # 供应商
    },

    # 商品管理URL
    'product': {
        'item': '/product/item',                       # 商品
        'attribute': '/product/attribute'              # 属性管理
    },

    # 门店运营URL
    'storeOperations': {
        'order': '/store-supply/demand-daily',         # 订货
        'productionOrder': '/boh-product-order/store', # 生产单
        'requestOrder': '/store-supply/order',         # 要货
        'selfPicking': '/store-supply/self-picking',   # 自采
        'receive': '/store-supply/receive',            # 订货收货
        'receiveDiff': '/store-supply/receive-diff',   # 收货差异
        'return': '/store-supply/return',              # 退货
        'adjust': '/store-supply/adjust',              # 报废
        'stocktake': '/store-supply/stocktake',        # 盘点
        'transfer': '/store-supply/transfer',          # 调拨
        'inventoryTrace': '/store-supply/inventory/trace',      # 库存流水
        'inventoryRealtime': '/store-supply/inventory/realtime', # 实时库存
        'inventoryDaily': '/store-supply/inventory/daily'        # 每日库存
    },

    # 仓库运营URL
    'warehouseOperations': {
        'productionOrder': '/boh-product-order/warehouse', # 生产单
        'purchase': '/warehouse/purchase',                  # 采购
        'receive': '/warehouse/receive',                    # 采购收货
        'purchaseReturn': '/warehouse/purchase-return',     # 采购退货
        'storeReturn': '/warehouse/store-return',           # 门店退货
        'sendOrder': '/warehouse/send-order',               # 发货
        'transfer': '/warehouse/transfer',                  # 调拨
        'stocktake': '/warehouse/stocktake',                # 盘点
        'adjust': '/warehouse/adjust',                      # 报废
        'inventoryTrace': '/warehouse/inventory/trace',     # 库存流水
        'inventoryRealtime': '/warehouse/inventory/realtime', # 实时库存
        'inventoryDaily': '/warehouse/inventory/daily'      # 每日库存
    },

    # 门店单据审核URL
    'storeAudit': {
        'receiveDiff': '/store-audit/receive-diff',    # 收货差异单
        'return': '/store-audit/return'                # 门店退货
    },

    # 门店运营管理URL
    'storeManagement': {
        'orderSchedule': '/store-management/schedule/order',         # 订货计划
        'stocktakeSchedule': '/store-management/schedule/stocktake', # 盘点计划
        'adjustSchedule': '/store-management/schedule/adjust',       # 报废计划
        'stocktakeIrregular': '/store-management/stocktake-irregular', # 不定期盘点
        'orderRule': '/store-management/order-rule',                 # 订货规则
        'adjustDemand': '/store-management/adjust-demand',           # 库存调整-门店订货
        'adjustReturn': '/store-management/adjust-return',           # 库存调整-门店退货
        'demandMain': '/store-management/demand-main'                # 总部分配
    },

    # 仓库运营管理URL
    'warehouseManagement': {
        'stocktakeSchedule': '/warehouse-management/schedule/stocktake', # 盘点计划
        'adjustSchedule': '/warehouse-management/schedule/adjust'        # 报废计划
    },

    # 供应商平台URL
    'supplier': {
        'demandOrder': '/supplier/demand-order',       # 要货单
        'sendOrder': '/supplier/send-order',           # 发货单
        'returnOrder': '/supplier/return-order'        # 退货单
    },

    # 门店报表URL
    'storeReport': {
        'orderReport': '/store-bi/order'               # 要货单报表
    }
}


def get_full_url(base_url: str, path: str) -> str:
    """
    获取完整的URL（需要配合baseUrl使用）
    
    Args:
        base_url: 基础URL（如：https://saas-boh-qa.hexcloud.cn）
        path: 相对路径（如：/store-supply/demand-daily）
        
    Returns:
        完整的URL
    """
    # 移除baseUrl末尾的斜杠
    clean_base_url = base_url.rstrip('/')
    # 确保path以斜杠开头
    clean_path = path if path.startswith('/') else f'/{path}'
    return f'{clean_base_url}{clean_path}'


def get_boh_base_url(env: str = None) -> str:
    """
    根据环境获取BOH的baseUrl
    
    Args:
        env: 环境名称（'production' 或 'test'），如果为None则从环境变量获取
        
    Returns:
        BOH的baseUrl
    """
    if env is None:
        env = os.getenv('ENV', 'test')
    
    boh_base_urls = {
        'production': 'https://boh.hexcloud.cn',
        'test': 'https://saas-boh-qa.hexcloud.cn'
    }
    return boh_base_urls.get(env, boh_base_urls['test'])


def get_current_boh_url(path: str) -> str:
    """
    便捷函数：获取当前环境的完整URL
    
    Args:
        path: 相对路径（如：/store-supply/demand-daily）
        
    Returns:
        当前环境的完整URL
    """
    from .login_config import BOH_BASE_URL
    return get_full_url(BOH_BASE_URL, path)










