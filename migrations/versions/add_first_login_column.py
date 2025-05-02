"""add first_login column

Revision ID: add_first_login_column
Revises: add_netid_column
Create Date: 2024-04-24 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_first_login_column'
down_revision = 'add_netid_column'
branch_labels = None
depends_on = None


def upgrade():
    # Add first_login column with default value True
    op.add_column('users', sa.Column('first_login', sa.Boolean(), nullable=False, server_default='true'))


def downgrade():
    # Remove first_login column
    op.drop_column('users', 'first_login') 