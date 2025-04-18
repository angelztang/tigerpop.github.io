"""create users table

Revision ID: create_users_table
Revises: 20240416_add_buyer_id
Create Date: 2024-04-18

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'create_users_table'
down_revision = '20240416_add_buyer_id'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('users',
        sa.Column('netid', sa.String(length=80), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('netid')
    )

def downgrade():
    op.drop_table('users') 